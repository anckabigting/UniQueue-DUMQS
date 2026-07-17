require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors'); // Install with 'npm install cors' to allow frontend communication

const app = express();
app.use(express.json());
app.use(cors());

// Configure Database Connection Pool using Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for secure Neon connections
});

// Authentication Endpoint (Req R1 equivalent)
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // 1. Check if user exists in NeonDB
    const userResult = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    // 2. Enforce role-based checking 
    if (user.role !== role) {
      return res.status(403).json({ success: false, message: 'Unauthorized role gateway access.' });
    }

    // 3. Compare submitted password with hashed password in DB
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Send success response
    res.json({
      success: true,
      user: { email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));