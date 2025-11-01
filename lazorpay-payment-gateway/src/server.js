const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "payment-card-fields")));

app.listen(3005, () => {
  console.log("Lazorpay server listening on port 3005");
});

app.get("/cardFields", (req, res) => {
  /**
   * CSP to only allow iframe embedding from trusted origins
   * This prevents clickjacking attacks by blocking unauthorized iframe embedding
   * Read more here:
   * https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Clickjacking
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
   */
  res.set("Content-Security-Policy", "frame-ancestors http://localhost:3000");
  res.sendFile(path.join(__dirname, "payment-card-fields", "index.html"));
});

app.get("/sdk.js", (req, res) => {
  res.sendFile(path.join(__dirname, "sdk.js"));
});

// By default, Cross origin requests are blocked.
app.get("/api/payment-blocked", (req, res) => {
  res.json({
    message: "You'll only see this message if you're on the same origin.",
  });
});

// CORS allowed for the merchant's origin.
app.get("/api/payment-allowed", cors("http://localhost:3000"), (req, res) => {
  res.json({
    message: "You'll only see this message if you're on allowed origins.",
  });
});
