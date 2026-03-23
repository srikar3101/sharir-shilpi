# Sharir Shilpi (Body Sculptor) - Full Stack Edition

Sharir Shilpi is a premium fitness tracking application featuring a high-performance Node.js/SQLite backend and a next-generation animation system.

## 🚀 Features

### Frontend (Premium UI)
- **Liquid Mesh Background**: GPU-accelerated WebGL mesh reacting to cursor motion.
- **Magnetic Haptics**: Sidebar and navigation items that physically attract to the cursor.
- **3D Parallax Cards**: Visual depth using perspective-tilt effects on dashboard components.
- **Adaptive Dark Mode**: Fully synchronized theme system across UI and WebGL layers.
- **Next-Gen Transitions**: Liquid morph and perspective zoom transitions between screens.

### Backend (Robust Infrastructure)
- **Node.js & Express**: Scalable REST API architecture.
- **SQLite3 Database**: Persistent, relational storage for user profiles, meal logs, and workouts.
- **Granular APIs**: Dedicated endpoints for macronutrient tracking, weight history, and PRs.
- **Bcrypt Security**: Secure, hashed password storage for user registration and login.

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/srikar3101/sharir-shilpi.git
   cd sharir-shilpi
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🏃 Running the Application

To run both the frontend (Port 8080) and backend (Port 3000) simultaneously:

```bash
npm run dev
```

Alternatively, you can run them in separate terminals:
- **Backend**: `npm start`
- **Frontend**: `python -m http.server 8080`

## 🤝 Contributing
Contributions are welcome! Please follow the established coding standards and linting rules.
