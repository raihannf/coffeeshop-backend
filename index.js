const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

let db;

// Function to handle database connection and reconnections
function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      setTimeout(handleDisconnect, 2000); // Retry after 2 seconds if connection fails
    } else {
      console.log("Connected to MySQL database");
    }
  });

  db.on("error", (err) => {
    console.error("MySQL error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("Attempting to reconnect to MySQL...");
      handleDisconnect(); // Reconnect on connection loss
    } else {
      throw err; // Throw unexpected errors
    }
  });
}

handleDisconnect(); // Initialize the connection

// Routes
app.post("/api/notes", (req, res) => {
  const { nama, kategori, deskripsi, makanan_pelengkap } = req.body;
  const query =
    "INSERT INTO coffeedrinknote (nama, kategori, deskripsi, makanan_pelengkap) VALUES (?, ?, ?, ?)";
  db.query(query, [nama, kategori, deskripsi, makanan_pelengkap], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: result.insertId,
      nama,
      kategori,
      deskripsi,
      makanan_pelengkap,
    });
  });
});

app.get("/api/notes", (req, res) => {
  db.query("SELECT * FROM coffeedrinknote", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

app.get("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM coffeedrinknote WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Note not found" });
    res.status(200).json(results[0]);
  });
});

app.put("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  const { nama, kategori, deskripsi, makanan_pelengkap } = req.body;
  const query =
    "UPDATE coffeedrinknote SET nama = ?, kategori = ?, deskripsi = ?, makanan_pelengkap = ? WHERE id = ?";
  db.query(query, [nama, kategori, deskripsi, makanan_pelengkap, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Note updated successfully" });
  });
});

app.delete("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM coffeedrinknote WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Note deleted successfully" });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
