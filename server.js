require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { HttpsProxyAgent } = require("https-proxy-agent");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Webhook endpoint to forward the request to an external server
app.post("/webhook", async (req, res) => {
  try {
    // API Key Authentication
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }

    const { fullUrl, method = "GET", data = {} } = req.body;

    // Validate fullUrl
    if (!fullUrl || typeof fullUrl !== "string" || !fullUrl.startsWith("http")) {
      return res.status(400).json({ error: "Invalid request. fullUrl is required and must be a valid URL." });
    }

    // Fixie Proxy settings
    const proxyUrl = process.env.FIXIE_URL;
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

    // Request options
    const requestOptions = {
      method: method.toUpperCase(),
      url: fullUrl,
      data: method.toUpperCase() === "POST" ? data : {},
      httpsAgent: agent,
      timeout: 5000,
    };

    // Send request to external server
    const response = await axios(requestOptions);

    console.log("Webhook sent successfully:", response.data);
    res.status(200).json({ message: "Webhook sent successfully", response: response.data });

  } catch (error) {
    console.error("Error sending webhook:", error.message);
    res.status(500).json({ error: "Failed to send webhook" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});