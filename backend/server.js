require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: process.env.DB_Password,
    database: "reservroom", 
  });
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL Database");
  }
});

app.post("/register", (req, res) => {
  const { full_name, email, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: err });

    const sql = "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)";
    db.query(sql, [full_name, email, hash], (err, result) => {
      if (err) return res.status(500).json({ error: "User already exists" });
      res.status(201).json({ message: "User registered successfully!" });
    });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];

    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err });

      if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ userId: user.id, full_name: user.full_name }, "secret_key", { expiresIn: "1h" });
      res.json({ message: "Login successful", token });
    });
  });
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
