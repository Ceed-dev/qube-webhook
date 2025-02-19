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
    console.log("🔵 [INFO] Received webhook request");

    // API Key Authentication
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      console.warn("🟠 [WARNING] Unauthorized request - Invalid API Key");
      return res.status(403).json({ error: "Forbidden: Invalid API Key" });
    }

    const { fullUrl, method = "GET", data = {} } = req.body;

    // Validate fullUrl
    if (!fullUrl || typeof fullUrl !== "string" || !fullUrl.startsWith("http")) {
      console.warn("🟠 [WARNING] Invalid request - Missing or invalid 'fullUrl'");
      return res.status(400).json({ error: "Invalid request. fullUrl is required and must be a valid URL." });
    }

    console.log(`📡 [INFO] Forwarding request to: ${fullUrl} | Method: ${method}`);

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

    console.log(`✅ [SUCCESS] Webhook sent successfully to ${fullUrl}`);
    console.log("🔍 [DEBUG] Response Data:", response.data);

    res.status(200).json({ 
      message: "Webhook sent successfully", 
      response: response.data 
    });

  } catch (error) {
    console.error("❌ [ERROR] Failed to send webhook");
    console.error("🛑 [ERROR DETAILS]", error.message);
    if (error.response) {
      console.error("🔻 [ERROR RESPONSE DATA]", error.response.data);
    }

    res.status(500).json({
      error: "Failed to send webhook",
      details: error.message,
      response: error.response?.data || null,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 [SERVER] Running on port ${PORT}`);
});