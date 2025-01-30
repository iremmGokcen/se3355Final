import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import multer from "multer";

const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend address
    credentials: true, // Allows sending cookies
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Dosya yükleme için multer
const upload = multer({ dest: "uploads/" });

// Session Ayarları
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTPS kullanmıyorsanız "false"
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// SQLite Bağlantısı
let db;
(async () => {
  db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  // Kullanıcılar tablosunu oluştur
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      photo TEXT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL
    );
  `);

  // Araç Kiralama (rentals) Tablosunu oluştur
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      pickup_office TEXT NOT NULL,
      return_office TEXT NOT NULL,
      pickup_date TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      return_date TEXT NOT NULL,
      return_time TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  await db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    price INTEGER NOT NULL,
    transmission TEXT NOT NULL,
    image TEXT NOT NULL
  );
 `);
 
  console.log("Database connected and users table created.");
})();



// Passport.js Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await db.get("SELECT * FROM users WHERE email = ?", [
          email,
        ]);
        if (!user) {
          return done(null, false, { message: "Incorrect email" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serialize User:", user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    console.log("Deserialize User:", user);
    done(null, user);
  } catch (error) {
    done(error);
  }
});




// Register Endpoint
app.post("/auth/register", upload.single("photo"), async (req, res) => {
  try {
    const { email, password, country, city, firstName, lastName } = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!email || !password || !country || !city || !firstName || !lastName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Password must be at least 8 characters, include a number, a special character, and a letter.
    if (!/^(?=.*[0-9])(?=.*[^a-zA-Z0-9])(?=.*[a-zA-Z]).{8,}$/.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters, include a number, and a special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run(
      `INSERT INTO users (email, password, country, city, photo, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [email, hashedPassword, country, city, photo, firstName, lastName]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

// Login Endpoint
app.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      return res.status(500).json({ error: "An error occurred during login." });
    }
    if (!user) {
      console.error("Login failed:", info.message);
      return res.status(401).json({ error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login session error:", err);
        return res.status(500).json({ error: "Failed to log in user." });
      }
      console.log("User logged in successfully:", user);
      console.log("Session:", req.session);
      console.log("Is Authenticated:", req.isAuthenticated());
      return res.status(200).json({ message: `Welcome, ${user.firstName}!` });
    });
  })(req, res, next);
});


// Logout Endpoint
app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "An error occurred during logout" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
});

//  // Profile Endpoint
// app.get("/auth/profile", (req, res) => {
//   if (req.isAuthenticated()) {
//     res.status(200).json({ message: `Welcome, ${req.user.firstName}` });
//   } else {
//      res.status(401).json({ error: "Unauthorized" });
//    }
//  });

 app.get("/auth/user-info", (req, res) => {
  console.log("User in session:", req.user);
  console.log("Is Authenticated:", req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.status(200).json({
      firstName: req.user.firstName,
      photo: req.user.photo
        ? `http://localhost:5000/uploads/${req.user.photo}`
        : null,
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});


// Hata Yönlendirmesi
app.get("/auth/login-failed", (req, res) => {
  res.status(401).json({ error: "Login failed" });
});


// 🚗 Araç Kiralama Endpoint
app.post("/api/rent", async (req, res) => {
  try {
    const { user_id, pickup_office, return_office, pickup_date, pickup_time, return_date, return_time } = req.body;

    if (!pickup_office || !return_office || !pickup_date || !pickup_time || !return_date || !return_time) {
      return res.status(400).json({ error: "Lütfen tüm alanları doldurun!" });
    }

    await db.run(
      `INSERT INTO rentals (user_id, pickup_office, return_office, pickup_date, pickup_time, return_date, return_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id || null, pickup_office, return_office, pickup_date, pickup_time, return_date, return_time]
    );

    res.status(201).json({ message: "Araç başarıyla kiralandı!" });
  } catch (error) {
    console.error("Araç kiralama hatası:", error);
    res.status(500).json({ error: "Kiralama sırasında bir hata oluştu." });
  }
});

// 📍 Yakındaki Ofisleri Getir
app.get("/api/nearby-offices", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Konum bilgisi eksik!" });
    }

    const offices = [
      { name: "Avis İstanbul Taksim", lat: 41.0351, lng: 28.9847 },
      { name: "Avis İstanbul Havalimanı", lat: 41.2606, lng: 28.7426 },
      { name: "Avis Ankara Kızılay", lat: 39.9208, lng: 32.8541 },
      { name: "Avis İzmir Alsancak", lat: 38.4365, lng: 27.1374 },
      { name: "Avis Antalya Havalimanı", lat: 36.8982, lng: 30.8013 },
    ];

    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const nearbyOffices = offices
      .map((office) => ({
        ...office,
        distance: getDistance(lat, lng, office.lat, office.lng),
      }))
      .filter((office) => office.distance <= 30)
      .sort((a, b) => a.distance - b.distance);

    res.json(nearbyOffices);
  } catch (error) {
    console.error("Yakındaki ofisleri bulma hatası:", error);
    res.status(500).json({ error: "Ofisleri getirirken hata oluştu." });
  }
});

app.get("/api/cars", async (req, res) => {
  try {
    const cars = await db.all("SELECT * FROM cars");
    res.json(cars);
  } catch (error) {
    console.error("Araçları alırken hata:", error);
    res.status(500).json({ error: "Araç listesi yüklenemedi." });
  }
});



// Sunucuyu Başlat
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
