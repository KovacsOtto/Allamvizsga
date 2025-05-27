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
        page_number: req.query.page_number || 1,
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


app.get("/api/hotels/details/:id", async (req, res) => {
  const { id } = req.params;
  const { check_in, check_out, adults, children, room_qty } = req.query;

  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelDetails", {
      params: {
        hotel_id: id,
        arrival_date: check_in,
        departure_date: check_out,
        adults,
        children_age: children ? children.split(",").join("%2C") : "",
        room_qty,
        units: "metric",
        temperature_unit: "c",
        languagecode: "en-us",
        currency_code: "EUR",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to fetch hotel details" });
  }
});


app.get("/api/hotels/photos/:hotel_id", async (req, res) => {
  const { hotel_id } = req.params;
  
  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelPhotos", {
      params: { hotel_id },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    });

    if (response.data.status && response.data.data.length > 0) {
      res.json({ status: true, data: response.data.data });
    } else {
      res.json({ status: false, message: "No images found" });
    }
  } catch (error) {
    console.error("Error fetching hotel photos:", error);
    res.status(500).json({ status: false, message: "Failed to fetch photos" });
  }
});

app.get("/api/hotels/description/:id", async (req, res) => {
  try {
    const hotelId = req.params.id;
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/getDescriptionAndInfo", {
      params: {
        hotel_id: hotelId,
        languagecode: "en-us",
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    });

    console.log("Full API Response:", response.data); 

    if (response.data && response.data.data.length > 0) {
      const englishDescriptions = response.data.data.filter(desc => desc.languagecode === "en-us");
      
      const description = englishDescriptions.length > 0 ? englishDescriptions[0].description : response.data.data[0].description;

      console.log("Extracted Description:", description); 
      console.log("response",response.data);

      res.json({ success: true, description: description || "No description available." });
    } else {
      res.json({ success: false, message: "No description found" });
    }
  } catch (error) {
    console.error("Error fetching hotel description:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.get('/api/attractions/by-city', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: "Missing city parameter" });

  try {
    const searchRes = await axios.get('https://booking-com15.p.rapidapi.com/api/v1/attraction/searchLocation', {
      params: {
        query: city,
        languagecode: 'en-us'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      }
    });

    const productData = searchRes.data.data?.products?.[0];
    if (!productData || !productData.id) {
      return res.status(404).json({ error: "No matching product location found for this city." });
    }

    const locationId = productData.id;

    const attractionRes = await axios.get('https://booking-com15.p.rapidapi.com/api/v1/attraction/searchAttractions', {
      params: {
        id: locationId,
        sortBy: 'trending',
        page: '1',
        currency_code: 'EUR',
        languagecode: 'en-us'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      }
    });

    const products = attractionRes.data.data?.products || [];
    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Attraction Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attractions." });
  }
});




app.listen(5000, () => {
  console.log(" Server running on http://localhost:5000");
});
