const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routes");

const app = express();

// app.use(cors({ origin: true, credentials: true }));
const allowedOrigins = [
  "https://spelcek.praktekoding.com",
  "https://drum-legal-tuna.ngrok-free.app",
  "http://localhost:5173",
];

// Konfigurasi CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Cek apakah asal ada dalam daftar yang diizinkan
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// set limit JSON body parsing
app.use(express.json({ limit: '50mb' }));

// Menggunakan middleware cors dengan opsi yang ditentukan
app.use(cors(corsOptions));

app.use(express.static("public"));
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(router);

app.listen(3000, function (err) {
  if (err) console.log("Error in server setup");
  console.log("Server listening on Port", 3000);
});
