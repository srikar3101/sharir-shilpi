const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Middleware
app.use(cors());
app.use(express.json());

// Promisify Database
const db = new sqlite3.Database(DB_PATH);

const dbRun = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// Initialize Schema
async function initDB() {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY, password TEXT NOT NULL, name TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS profiles (
            email TEXT PRIMARY KEY, sex TEXT, age INTEGER, height REAL, weight REAL, target_weight REAL, pace REAL, act_mult REAL, start_date TEXT, cal_override INTEGER, FOREIGN KEY(email) REFERENCES users(email)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS weight_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, date TEXT, weight REAL, FOREIGN KEY(email) REFERENCES users(email)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS food_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, date TEXT, meal_type TEXT, name TEXT, cal REAL, p REAL, c REAL, f REAL, qty REAL, unit TEXT, FOREIGN KEY(email) REFERENCES users(email)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS workout_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, date TEXT, type TEXT, name TEXT, duration REAL, burned REAL, sets INTEGER, reps INTEGER, weight REAL, FOREIGN KEY(email) REFERENCES users(email)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS daily_metrics (
            email TEXT, date TEXT, water INTEGER DEFAULT 0, PRIMARY KEY(email, date), FOREIGN KEY(email) REFERENCES users(email)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS custom_foods (
            id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, name TEXT, cal REAL, p REAL, c REAL, f REAL, FOREIGN KEY(email) REFERENCES users(email)
        )`);
        await dbRun(`CREATE TABLE IF NOT EXISTS personal_records (
            email TEXT, ex_name TEXT, w REAL, r INTEGER, s INTEGER, date TEXT, PRIMARY KEY(email, ex_name), FOREIGN KEY(email) REFERENCES users(email)
        )`);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Database initialization failed:', err);
    }
}
initDB();

// --- API ROUTES ---

// Auth
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
    try {
        const hash = await bcrypt.hash(password, 10);
        await dbRun(`INSERT INTO users (email, password, name) VALUES (?, ?, ?)`, [email, hash, name]);
        res.status(201).json({ message: 'User registered' });
    } catch (e) { res.status(400).json({ error: 'Email already registered' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [email]);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ email: user.email, name: user.name });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Profile
app.get('/api/profile', async (req, res) => {
    try {
        const sql = `SELECT p.*, u.name, u.email FROM profiles p JOIN users u ON p.email = u.email WHERE p.email = ?`;
        const row = await dbGet(sql, [req.query.email]);
        res.json(row || null);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/profile', async (req, res) => {
    const { email, sex, age, height, weight, targetWeight, pace, actMult, startDate, calOverride } = req.body;
    try {
        const sql = `INSERT INTO profiles (email, sex, age, height, weight, target_weight, pace, act_mult, start_date, cal_override) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON CONFLICT(email) DO UPDATE SET 
                     sex=excluded.sex, age=excluded.age, height=excluded.height, weight=excluded.weight, 
                     target_weight=excluded.target_weight, pace=excluded.pace, act_mult=excluded.act_mult, 
                     cal_override=excluded.cal_override`;
        await dbRun(sql, [email, sex, age, height, weight, targetWeight, pace, actMult, startDate, calOverride]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Full Logs Fetch
app.get('/api/logs', async (req, res) => {
    const { email, date } = req.query;
    try {
        const [w, foods, workouts, m] = await Promise.all([
            dbGet(`SELECT weight FROM weight_history WHERE email=? AND date=?`, [email, date]),
            dbAll(`SELECT * FROM food_logs WHERE email=? AND date=?`, [email, date]),
            dbAll(`SELECT * FROM workout_logs WHERE email=? AND date=?`, [email, date]),
            dbGet(`SELECT water FROM daily_metrics WHERE email=? AND date=?`, [email, date])
        ]);
        const foodLog = { breakfast: [], lunch: [], snacks: [], dinner: [] };
        foods.forEach(f => foodLog[f.meal_type].push(f));
        res.json({ weight: w ? w.weight : null, foodLog, workoutLog: workouts, water: m ? m.water : 0 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Weight
app.post('/api/weight', async (req, res) => {
    try {
        const { email, date, weight } = req.body;
        await dbRun(`INSERT INTO weight_history (email, date, weight) VALUES (?, ?, ?)`, [email, date, weight]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Food
app.post('/api/food', async (req, res) => {
    const { email, date, meal_type, name, cal, p, c, f, qty, unit } = req.body;
    try {
        const resObj = await dbRun(`INSERT INTO food_logs (email, date, meal_type, name, cal, p, c, f, qty, unit) VALUES (?,?,?,?,?,?,?,?,?,?)`, 
            [email, date, meal_type, name, cal, p, c, f, qty, unit]);
        res.json({ id: resObj.lastID });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/food/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM food_logs WHERE id=?`, [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Workouts
app.post('/api/workout', async (req, res) => {
    const { email, date, type, name, duration, burned, sets, reps, weight } = req.body;
    try {
        const resObj = await dbRun(`INSERT INTO workout_logs (email, date, type, name, duration, burned, sets, reps, weight) VALUES (?,?,?,?,?,?,?,?,?)`, 
            [email, date, type, name, duration, burned, sets, reps, weight]);
        res.json({ id: resObj.lastID });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/workout/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM workout_logs WHERE id=?`, [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Water
app.post('/api/water', async (req, res) => {
    const { email, date, water } = req.body;
    try {
        await dbRun(`INSERT INTO daily_metrics (email, date, water) VALUES (?, ?, ?) ON CONFLICT(email, date) DO UPDATE SET water=excluded.water`, [email, date, water]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Misc History & Config
app.get('/api/history/weight', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT date, weight FROM weight_history WHERE email=? ORDER BY date ASC`, [req.query.email]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/custom-foods', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM custom_foods WHERE email=?`, [req.query.email]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/custom-foods', async (req, res) => {
    const { email, name, cal, p, c, f } = req.body;
    try {
        await dbRun(`INSERT INTO custom_foods (email, name, cal, p, c, f) VALUES (?,?,?,?,?,?)`, [email, name, cal, p, c, f]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/prs', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM personal_records WHERE email=?`, [req.query.email]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/prs', async (req, res) => {
    const { email, ex_name, w, r, s, date } = req.body;
    try {
        await dbRun(`INSERT INTO personal_records (email, ex_name, w, r, s, date) VALUES (?,?,?,?,?,?) 
                     ON CONFLICT(email, ex_name) DO UPDATE SET w=excluded.w, r=excluded.r, s=excluded.s, date=excluded.date`, [email, ex_name, w, r, s, date]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Optimized Backend running on http://localhost:${PORT}`);
});
