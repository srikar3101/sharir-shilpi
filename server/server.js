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

// Initialize Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    
    db.serialize(() => {
      // Users Table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Profiles Table
      db.run(`CREATE TABLE IF NOT EXISTS profiles (
        email TEXT PRIMARY KEY,
        sex TEXT,
        age INTEGER,
        height REAL,
        weight REAL,
        target_weight REAL,
        pace REAL,
        act_mult REAL,
        start_date TEXT,
        cal_override INTEGER,
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Weight History Table
      db.run(`CREATE TABLE IF NOT EXISTS weight_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        date TEXT,
        weight REAL,
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Food Logs Table
      db.run(`CREATE TABLE IF NOT EXISTS food_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        date TEXT,
        meal_type TEXT,
        name TEXT,
        cal REAL,
        p REAL,
        c REAL,
        f REAL,
        qty REAL,
        unit TEXT,
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Workout Logs Table
      db.run(`CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        date TEXT,
        type TEXT,
        name TEXT,
        duration REAL,
        burned REAL,
        sets INTEGER,
        reps INTEGER,
        weight REAL,
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Daily Metrics (Water, etc.)
      db.run(`CREATE TABLE IF NOT EXISTS daily_metrics (
        email TEXT,
        date TEXT,
        water INTEGER DEFAULT 0,
        PRIMARY KEY(email, date),
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Custom Foods
      db.run(`CREATE TABLE IF NOT EXISTS custom_foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        name TEXT,
        cal REAL,
        p REAL,
        c REAL,
        f REAL,
        FOREIGN KEY(email) REFERENCES users(email)
      )`);

      // Personal Records
      db.run(`CREATE TABLE IF NOT EXISTS personal_records (
        email TEXT,
        ex_name TEXT,
        w REAL,
        r INTEGER,
        s INTEGER,
        date TEXT,
        PRIMARY KEY(email, ex_name),
        FOREIGN KEY(email) REFERENCES users(email)
      )`);
    });
  }
});

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (email, password, name) VALUES (?, ?, ?)`, [email, hashedPassword, name], function(err) {
      if (err) return res.status(400).json({ error: 'User already exists or DB error' });
      res.status(201).json({ message: 'User registered' });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ email: user.email, name: user.name });
  });
});

// --- PROFILE ENDPOINTS ---

app.get('/api/profile', (req, res) => {
  db.get(`SELECT * FROM profiles WHERE email = ?`, [req.query.email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

app.post('/api/profile', (req, res) => {
  const { email, sex, age, height, weight, targetWeight, pace, actMult, startDate, calOverride } = req.body;
  const sql = `INSERT INTO profiles (email, sex, age, height, weight, target_weight, pace, act_mult, start_date, cal_override) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(email) DO UPDATE SET 
               sex=excluded.sex, age=excluded.age, height=excluded.height, weight=excluded.weight, 
               target_weight=excluded.target_weight, pace=excluded.pace, act_mult=excluded.act_mult, 
               cal_override=excluded.cal_override`;
  db.run(sql, [email, sex, age, height, weight, targetWeight, pace, actMult, startDate, calOverride], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- LOG ENDPOINTS ---

app.get('/api/logs', (req, res) => {
  const { email, date } = req.query;
  const data = { weight: null, foodLog: { breakfast: [], lunch: [], snacks: [], dinner: [] }, workoutLog: [], water: 0 };
  
  db.serialize(() => {
    db.get(`SELECT weight FROM weight_history WHERE email=? AND date=?`, [email, date], (err, row) => {
      if (row) data.weight = row.weight;
    });
    db.all(`SELECT * FROM food_logs WHERE email=? AND date=?`, [email, date], (err, rows) => {
      if (rows) rows.forEach(r => data.foodLog[r.meal_type].push(r));
    });
    db.all(`SELECT * FROM workout_logs WHERE email=? AND date=?`, [email, date], (err, rows) => {
      if (rows) data.workoutLog = rows;
    });
    db.get(`SELECT water FROM daily_metrics WHERE email=? AND date=?`, [email, date], (err, row) => {
      if (row) data.water = row.water || 0;
      res.json(data);
    });
  });
});

app.post('/api/weight', (req, res) => {
  const { email, date, weight } = req.body;
  db.run(`INSERT INTO weight_history (email, date, weight) VALUES (?, ?, ?)`, [email, date, weight], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/food', (req, res) => {
  const { email, date, meal_type, name, cal, p, c, f, qty, unit } = req.body;
  db.run(`INSERT INTO food_logs (email, date, meal_type, name, cal, p, c, f, qty, unit) VALUES (?,?,?,?,?,?,?,?,?,?)`, 
    [email, date, meal_type, name, cal, p, c, f, qty, unit], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/workout', (req, res) => {
  const { email, date, type, name, duration, burned, sets, reps, weight } = req.body;
  db.run(`INSERT INTO workout_logs (email, date, type, name, duration, burned, sets, reps, weight) VALUES (?,?,?,?,?,?,?,?,?)`, 
    [email, date, type, name, duration, burned, sets, reps, weight], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/water', (req, res) => {
  const { email, date, water } = req.body;
  db.run(`INSERT INTO daily_metrics (email, date, water) VALUES (?, ?, ?) ON CONFLICT(email, date) DO UPDATE SET water=excluded.water`, 
    [email, date, water], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- MISC ---

app.get('/api/history/weight', (req, res) => {
  db.all(`SELECT date, weight FROM weight_history WHERE email=? ORDER BY date ASC`, [req.query.email], (err, rows) => {
    res.json(rows || []);
  });
});

app.get('/api/custom-foods', (req, res) => {
  db.all(`SELECT * FROM custom_foods WHERE email=?`, [req.query.email], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/custom-foods', (req, res) => {
  const { email, name, cal, p, c, f } = req.body;
  db.run(`INSERT INTO custom_foods (email, name, cal, p, c, f) VALUES (?,?,?,?,?,?)`, 
    [email, name, cal, p, c, f], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/prs', (req, res) => {
    db.all(`SELECT * FROM personal_records WHERE email=?`, [req.query.email], (err, rows) => {
      res.json(rows || []);
    });
});

app.post('/api/prs', (req, res) => {
    const { email, ex_name, w, r, s, date } = req.body;
    db.run(`INSERT INTO personal_records (email, ex_name, w, r, s, date) VALUES (?,?,?,?,?,?) 
            ON CONFLICT(email, ex_name) DO UPDATE SET w=excluded.w, r=excluded.r, s=excluded.s, date=excluded.date`, 
            [email, ex_name, w, r, s, date], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Structured Backend running on http://localhost:${PORT}`);
});
