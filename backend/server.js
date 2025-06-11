require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;

pool.connect((err, client, release) => {
  if (err) {
    console.error(" Failed to connect to PostgreSQL:", err.stack);
  } else {
    console.log(" Connected to PostgreSQL database successfully");
    release();
  }
});
/*
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
*/
/*
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
*/
app.post("/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3)";
    await pool.query(sql, [full_name, email, hash]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "User already exists or database error" });
  }
});


const SibApiV3Sdk = require('sib-api-v3-sdk');


app.post("/api/send-confirmation-email", async (req, res) => {
  const { to_email, to_name, total_price, currency, hotel, attractions } = req.body;

  if (!to_email || !to_name || !hotel || !total_price || !currency) {
    return res.status(400).json({ error: "Missing required booking data" });
  }

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const totalAttractionsPrice = attractions?.reduce((sum, a) => sum + Number(a.price || 0), 0) || 0;
  const grandTotal = (parseFloat(total_price) + totalAttractionsPrice).toFixed(2);

  const hotelHtml = `
    <div style="padding: 10px; border: 1px solid #ccc; border-radius: 10px; margin-bottom: 20px;">
      <h2 style="margin-bottom: 5px;">${hotel.name}</h2>
      <img src="${hotel.image || hotel.image_url}" alt="Hotel Image" width="300" style="border-radius:8px;" />
      <p><strong>Address:</strong> ${hotel.address}</p>
      <p><strong>Check-in:</strong> ${hotel.check_in}</p>
      <p><strong>Check-out:</strong> ${hotel.check_out}</p>
      <p><strong>Rooms:</strong> ${hotel.rooms}, Adults: ${hotel.adults}, Children: ${hotel.children}</p>
      <p><strong>Hotel Price:</strong> ${parseFloat(total_price).toFixed(2)} ${currency}</p>
    </div>
  `;

  const attractionsHtml = attractions?.length
    ? `<h3 style="margin-bottom:10px;">Booked Attractions:</h3>` +
        attractions.map(a => `
          <div style="display:flex; align-items:center; margin-bottom:14px; gap:10px;">
            <img src="${a.image || a.image_url}" alt="Attraction" width="80" style="border-radius:6px;" />
            <div>
              <p style="margin:0;"><strong>${a.name}</strong></p>
              <p style="margin:0;">${Number(a.price).toFixed(2)} ${currency}</p>
            </div>
          </div>
        `).join("")
    : "<p>No attractions booked.</p>";

  const htmlContent = `
    <html>
      <body style="font-family:sans-serif; padding:20px; color:#333;">
        <h1 style="color:#007B77;">Hello ${to_name},</h1>
        <p style="font-size:16px;">Thank you for your reservation! Here are your booking details:</p>
        ${hotelHtml}
        ${attractionsHtml}
        <hr style="margin: 30px 0;"/>
        <p style="font-size:18px;"><strong>Total Amount:</strong> ${grandTotal} ${currency}</p>
        <p style="font-size:16px;">We wish you a pleasant trip!<br/>The ReservRoom Team</p>
      </body>
    </html>
  `;

  try {
    const smtpEmail = {
      to: [{
        email: to_email,
        name: to_name
      }],
      sender: {
        name: "ReservRoom Team",
        email: "otto.kovacs1109@gmail.com"
      },
      subject: "Reservation Confirmation",
      htmlContent: htmlContent
    };

    const data = await apiInstance.sendTransacEmail(smtpEmail);
    console.log(" Brevo email sent successfully:", data);
    res.json({ success: true, data });
  } catch (error) {
    console.error(" Brevo SDK error:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error.message
    });
    res.status(500).json({ success: false, message: "Failed to send confirmation email" });
  }
});

/*
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
*/
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = $1";

  try {
    const result = await pool.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, full_name: user.full_name },
      "secret_key",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      created_at: user.created_at
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
/*
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
*/
app.post("/api/bookings", async (req, res) => {
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
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `;

  try {
    const result = await pool.query(sql, [
      user_id, hotel_id, hotel_name, hotel_address,
      check_in_date, check_out_date, num_adults, num_children,
      num_rooms, total_price, currency, hotel_image_url
    ]);

    res.json({ message: "Booking successful", booking_id: result.rows[0].id });
  } catch (err) {
    console.error("Booking insert failed:", err);
    res.status(500).json({ error: "Booking failed" });
  }
});

/*
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
*/
app.post("/api/favorites", async (req, res) => {
  const { user_id, hotel_id, hotel_name, hotel_address, hotel_image_url } = req.body;

  const sql = `
    INSERT INTO favorites (user_id, hotel_id, hotel_name, hotel_address, hotel_image_url)
    VALUES ($1, $2, $3, $4, $5)
  `;

  try {
    await pool.query(sql, [user_id, hotel_id, hotel_name, hotel_address, hotel_image_url]);
    res.json({ message: "Favorite saved" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
app.post("/api/booking-attractions", (req, res) => {
  const { booking_id, attractions } = req.body;

  if (!booking_id || !Array.isArray(attractions)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const values = attractions.map(a => [
    booking_id,
    a.name,
    a.description || "",
    a.price || 0,
    a.currency || "EUR",
    a.image_url || null,
    a.slug || null 
  ]);

  const sql = `
    INSERT INTO booking_attractions
    (booking_id, attraction_name, attraction_description, price, currency, image_url, slug)
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting attractions:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true, inserted: result.affectedRows });
  });
});
*/
app.post("/api/booking-attractions", async (req, res) => {
  const { booking_id, attractions } = req.body;

  if (!booking_id || !Array.isArray(attractions)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const values = attractions.map((a, index) => 
    `($1, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6}, $${index * 6 + 7})`
  ).join(", ");

  const params = attractions.flatMap(a => [
    a.name,
    a.description || "",
    a.price || 0,
    a.currency || "EUR",
    a.image_url || null,
    a.slug || null
  ]);

  const fullParams = [booking_id, ...params];

  const sql = `
    INSERT INTO booking_attractions
    (booking_id, attraction_name, attraction_description, price, currency, image_url, slug)
    VALUES ${values}
  `;

  try {
    await pool.query(sql, fullParams);
    res.json({ success: true, inserted: attractions.length });
  } catch (err) {
    console.error("Error inserting attractions:", err);
    res.status(500).json({ error: "Database error" });
  }
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
  const {
    dest_id,
    check_in,
    check_out,
    adults,
    children,
    room_qty,
    price_min,
    price_max,
    categories_filter,
    sort_by,
    page_number
  } = req.query;

  if (!dest_id || !check_in || !check_out || !adults || !room_qty) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels", {
      params: {
        dest_id,
        search_type: "CITY",
        arrival_date: check_in,
        departure_date: check_out,
        adults,
        children_age: children || "0",
        room_qty,
        page_number: page_number || 1,
        units: "metric",
        temperature_unit: "c",
        languagecode: "en-us",
        currency_code: "AED",
        ...(price_min && { price_min }),
        ...(price_max && { price_max }),
        ...(categories_filter && { categories_filter }),
        ...(sort_by && { sort_by })
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com"
      }
    });

    console.log("Backend received filters:", { price_min, price_max, categories_filter, sort_by });
    res.json(response.data);
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
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

    const baseProducts = attractionRes.data.data?.products || [];

    const enrichedProducts = await Promise.all(
      baseProducts.slice(0, 10).map(async (product) => {
        try {
          const detailRes = await axios.get('https://booking-com15.p.rapidapi.com/api/v1/attraction/getAttractionDetails', {
            params: {
              slug: product.slug,
              currency_code: 'EUR'
            },
            headers: {
              'x-rapidapi-key': process.env.RAPIDAPI_KEY,
              'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
            }
          });
          console.log("API response full:", response.data);

          return {
            ...product,
            ...detailRes.data.data,
            slug: detailRes.data.data?.slug || product.slug 
          };
        } catch (err) {
          return product; 
        }
      })
    );

    res.json({ success: true, data: enrichedProducts });
  } catch (error) {
    console.error("Attraction Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch attractions." });
  }
});

/*
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
*/
app.get("/api/bookings/:userId", async (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT * FROM bookings 
    WHERE user_id = $1
    ORDER BY check_in_date DESC
  `;

  try {
    const result = await pool.query(sql, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
/*
app.get("/api/favorites/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = "SELECT * FROM favorites WHERE user_id = ?";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});
*/
app.get("/api/favorites/:userId", async (req, res) => {
  const userId = req.params.userId;

  const sql = "SELECT * FROM favorites WHERE user_id = $1";

  try {
    const result = await pool.query(sql, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
app.delete("/api/favorites/:userId/:hotelId", (req, res) => {
  const { userId, hotelId } = req.params;

  const sql = "DELETE FROM favorites WHERE user_id = ? AND hotel_id = ?";
  db.query(sql, [userId, hotelId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to delete favorite" });
    res.json({ success: true });
  });
});
*/
app.delete("/api/favorites/:userId/:hotelId", async (req, res) => {
  const { userId, hotelId } = req.params;

  const sql = "DELETE FROM favorites WHERE user_id = $1 AND hotel_id = $2";

  try {
    await pool.query(sql, [userId, hotelId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to delete favorite:", err);
    res.status(500).json({ error: "Failed to delete favorite" });
  }
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

app.get("/api/hotels/filters", async (req, res) => {
  const axios = require("axios");
  const { dest_id, search_type = "CITY", adults, children_age, room_qty, arrival_date, departure_date } = req.query;

  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/getFilter", {
      params: {
        dest_id,
        search_type,
        adults,
        children_age,
        room_qty,
        arrival_date,      
        departure_date     
      },
      headers: {
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("Failed to fetch filters:", err.message);
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

app.get("/api/hotels/reviews/:id", async (req, res) => {
  const hotelId = req.params.id;
  const page = parseInt(req.query.page) || 1;

  try {
    const response = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/getHotelReviews", {
      params: {
        hotel_id: hotelId,
        sort_option_id: "sort_most_relevant",
        page_number: page,
        languagecode: "en-us"
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com"
      }
    });

    const allReviews = response.data?.data?.result || [];
    const totalCount = response.data?.data?.count || 0;

    const REVIEWS_PER_PAGE = 5;
    const paginated = allReviews.slice(0, REVIEWS_PER_PAGE);
    const totalScore = allReviews.reduce((sum, r) => sum + (r.average_score || 0), 0);
    const averageScore = allReviews.length > 0 ? totalScore / allReviews.length : null;


    res.json({ success: true, reviews: paginated, totalCount, averageScore });
  } catch (error) {
    console.error("Error fetching hotel reviews:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews." });
  }
});
app.get("/api/attractions/details", async (req, res) => {
  const { slug, currency_code = "USD" } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  try {
    const response = await axios.get(
      "https://booking-com15.p.rapidapi.com/api/v1/attraction/getAttractionDetails",
      {
        params: { slug, currency_code },
        headers: {
          "x-rapidapi-host": "booking-com15.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        },
      }
    );
    res.json({ data: response.data.data });
  } catch (err) {
    console.error("Attraction details fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch details" });
  }
});
/*
app.get("/api/booking-attractions/:bookingId", (req, res) => {
  const bookingId = req.params.bookingId;
  const sql = "SELECT * FROM booking_attractions WHERE booking_id = ?";

  db.query(sql, [bookingId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});
*/
app.get("/api/booking-attractions/:bookingId", async (req, res) => {
  const bookingId = req.params.bookingId;
  const sql = "SELECT * FROM booking_attractions WHERE booking_id = $1";

  try {
    const result = await pool.query(sql, [bookingId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/*
app.get("/api/recommendations/:userId", async (req, res) => {
  const { userId } = req.params;

  const recentBookingSql = `
    SELECT hotel_address, hotel_id
    FROM bookings
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(recentBookingSql, [userId], async (err, results) => {
    if (err || results.length === 0) return res.json([]);

    const lastAddress = results[0].hotel_address;
    const parts = lastAddress.split(",");
    const country = parts.length >= 1 ? parts[parts.length - 1].trim() : null;
    if (!country) return res.json([]);

    try {
      const searchRes = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination", {
        params: { query: country },
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        },
      });

      const candidates = Array.isArray(searchRes.data?.data) ? searchRes.data.data : [];

      const dest = candidates.find(d => 
        d.country?.toLowerCase() === country.toLowerCase() && d.search_type === "city"
      ) || candidates.find(d => 
        d.country?.toLowerCase() === country.toLowerCase()
      );

      if (!dest?.dest_id) return res.json([]);

      const hotelRes = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels", {
        params: {
          dest_id: dest.dest_id,
          search_type: "CITY",
          arrival_date: new Date().toISOString().slice(0, 10),
          departure_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          adults: 2,
          room_qty: 1,
          page_number: 1
        },
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        }
      });

      const hotels = hotelRes.data?.data?.hotels || [];
      res.json(hotels.slice(0, 6));


    } catch (e) {
      console.error("Recommendation error:", e?.response?.data || e.message);
      res.status(500).json({ error: "Recommendation failed" });
    }
  });
});
*/
app.get("/api/recommendations/:userId", async (req, res) => {
  const { userId } = req.params;

  const recentBookingSql = `
    SELECT hotel_address, hotel_id
    FROM bookings
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(recentBookingSql, [userId]);
    if (result.rows.length === 0) return res.json([]);

    const lastAddress = result.rows[0].hotel_address;
    const parts = lastAddress.split(",");
    const country = parts.length >= 1 ? parts[parts.length - 1].trim() : null;
    if (!country) return res.json([]);

    const searchRes = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination", {
      params: { query: country },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      },
    });

    const candidates = Array.isArray(searchRes.data?.data) ? searchRes.data.data : [];

    const dest = candidates.find(d =>
      d.country?.toLowerCase() === country.toLowerCase() && d.search_type === "city"
    ) || candidates.find(d =>
      d.country?.toLowerCase() === country.toLowerCase()
    );

    if (!dest?.dest_id) return res.json([]);

    const hotelRes = await axios.get("https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels", {
      params: {
        dest_id: dest.dest_id,
        search_type: "CITY",
        arrival_date: new Date().toISOString().slice(0, 10),
        departure_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        adults: 2,
        room_qty: 1,
        page_number: 1
      },
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
      }
    });

    const hotels = hotelRes.data?.data?.hotels || [];
    res.json(hotels.slice(0, 6));

  } catch (err) {
    console.error("Recommendation error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Recommendation failed" });
  }
});

app.listen(5000, () => {
  console.log(" Server running on http://localhost:5000");
});
