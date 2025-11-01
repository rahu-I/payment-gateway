const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  /**
   * CSP to only allow scripts from trusted origins
   * This prevents XSS attacks by blocking unauthorized scripts
   * Read more here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
   */
  res.set(
    "Content-Security-Policy",
    "script-src 'self' http://localhost:3005; frame-src http://localhost:3005"
  );
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log("Merchant's website listening on port 3000");
});
