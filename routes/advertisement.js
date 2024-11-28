const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await req.app.connection.query(
      "SELECT seller_id, product_id, price FROM trans_combined WHERE status = 'open' ORDER BY RAND() LIMIT 3"
    );
    res.setHeader("Content-Type", "application/json"); // 確保返回 JSON
    res.json(rows);
  } catch (err) {
    console.error("Error fetching advertisements:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
