require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

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
    console.error(" Database connection failed:", err);
  } else {
    console.log(" Connected to MySQL Database");
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

app.get("/api/search", async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Query parameter is required" });

  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination", {
      params: { query },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    });

    const suggestions = response.data.data.map((item) => ({
      id: item.dest_id,
      name: item.name,
      region: item.region,
      country: item.country,
    }));

    res.json(suggestions);
  } catch (error) {
    console.error(" API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch destination data" });
  }
});

app.get("/api/hotels", async (req, res) => {
  const { dest_id, check_in, check_out, adults, children, room_qty } = req.query;

  console.log(" Incoming Request Params:", req.query);

  if (!dest_id || !check_in || !check_out || !adults || !room_qty) {
    console.error(" Missing Parameters", req.query);
    return res.status(400).json({ error: "Missing required parameters", received: req.query });
  }

  console.log("Correcting Date Format: Ensuring Proper API Parameters");
  const formattedCheckIn = check_in;
  const formattedCheckOut = check_out;
  console.log({ formattedCheckIn, formattedCheckOut });

  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels", {
      params: {
        dest_id,
        search_type: "CITY",
        arrival_date: formattedCheckIn,   
        departure_date: formattedCheckOut,
        adults,
        children_age: children ? children.split(",").join("%2C") : "0",
        room_qty,
        page_number: 1,
        units: "metric",
        temperature_unit: "c",
        languagecode: "en-us",
        currency_code: "AED",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    });

    console.log(" Hotels API Response:", JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error(" API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});





app.listen(5000, () => {
  console.log(" Server running on http://localhost:5000");
});
