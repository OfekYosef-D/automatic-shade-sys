const express = require("express");
const { requireAuth } = require("@clerk/express");
const router = express.Router();
const connection = require("../db");

router.post("/sync", requireAuth, (req, res) => {
  console.log("POST /api/users/sync - Auth:", req.auth);
  console.log("POST /api/users/sync - Body:", req.body);

  const { userId } = req.auth;
  const { name, email } = req.body;

  console.log("Processing sync with:", {
    userId,
    name,
    email,
    authExists: !!req.auth,
    bodyExists: !!req.body,
  });

  if (!userId || !name || !email) {
    console.error("Missing required data:", { userId, name, email });
    return res.status(400).send("Missing required data");
  }

  connection.query(
    "INSERT IGNORE INTO users (clerk_id, name, email) VALUES (?, ?, ?)",
    [userId, name, email],
    (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).send("DB error");
        return;
      }
      console.log("Insert result:", result);
      res.send("User synced");
    }
  );
});

router.get("/", (req, res) => {
  console.log("GET /api/users - Auth:", req.auth);
  console.log("GET /api/users - Headers:", req.headers);

  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).send("Error fetching users");
      return;
    }
    console.log("Returning users:", results.length, results);
    res.json(results);
  });
});

module.exports = router;
