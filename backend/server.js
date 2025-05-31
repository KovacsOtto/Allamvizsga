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
      res.json({
        message: "Login successful",
        token,
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at
      });
    });
  });
});

app.post("/api/bookings", (req, res) => {
  const {
    user_id,
    hotel_id,
    hotel_name,
    hotel_address,
    check_in_date,
    check_out_date,
    num_adults,
    num_children,
    num_rooms,
    total_price,
    currency,
    hotel_image_url
  } = req.body;
  
  const sql = `
    INSERT INTO bookings (
      user_id, hotel_id, hotel_name, hotel_address,
      check_in_date, check_out_date, num_adults, num_children,
      num_rooms, total_price, currency, hotel_image_url
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(sql, [
    user_id, hotel_id, hotel_name, hotel_address,
    check_in_date, check_out_date, num_adults, num_children,
    num_rooms, total_price, currency, hotel_image_url
  ], (err, result) => {
    if (err) {
      console.error("Booking insert failed:", err);
      return res.status(500).json({ error: "Booking failed" });
    }
  
    res.json({ message: "Booking successful", booking_id: result.insertId });
  });
});

app.post("/api/favorites", (req, res) => {
  const { user_id, hotel_id, hotel_name, hotel_address, hotel_image_url } = req.body;

  const sql = `
    INSERT INTO favorites (user_id, hotel_id, hotel_name, hotel_address, hotel_image_url)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, hotel_id, hotel_name, hotel_address, hotel_image_url], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Favorite saved" });
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

app.get("/api/bookings/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT * FROM bookings 
    WHERE user_id = ?
    ORDER BY check_in_date DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.get("/api/favorites/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = "SELECT * FROM favorites WHERE user_id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.delete("/api/favorites/:userId/:hotelId", (req, res) => {
  const { userId, hotelId } = req.params;

  const sql = "DELETE FROM favorites WHERE user_id = ? AND hotel_id = ?";
  db.query(sql, [userId, hotelId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to delete favorite" });
    res.json({ success: true });
  });
});

app.get('/api/hotels/available', async (req, res) => {
  const { hotelIds, check_in, check_out } = req.query;

  if (!hotelIds || !check_in || !check_out) {
    return res.status(400).json({ error: "Missing hotelIds, check_in, or check_out parameter" });
  }

  const hotelIdList = hotelIds.split(',');

  try {
    const availabilityChecks = hotelIdList.map(hotel_id =>
      axios.get('https://booking-com15.p.rapidapi.com/api/v1/hotels/getAvailability', {
        params: {
          hotel_id,
          min_date: check_in,
          max_date: check_out
        },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
        }
      }).then(response => {
        const dates = response.data?.data?.avDates;
        const isAvailable = Array.isArray(dates) && dates.length > 0;
        return isAvailable ? hotel_id : null;
      }).catch(() => null) 
    );

    const results = await Promise.all(availabilityChecks);
    const availableHotels = results.filter(id => id !== null);

    res.json({ success: true, available: availableHotels });
  } catch (error) {
    console.error("Hotel Availability Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to check availability." });
  }
});





app.listen(5000, () => {
  console.log(" Server running on http://localhost:5000");
});
