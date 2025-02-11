require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Endpoints to receive webhook
app.post("/webhook", async (req, res) => {
  try {
    const { click_id } = req.body;

    if (!click_id) {
      return res.status(400).json({ error: "click_id is required" });
    }

    // ASP Webhook URL (obtained from environment variable)
    const aspWebhookUrl = `${process.env.ASP_WEBHOOK_URL}?identifier=${click_id}&supplier_id=89`;

    // Settings for sending requests via Fixie Proxy
    const proxy = {
      host: "velodrome.usefixie.com",
      port: 80,
      auth: {
        username: process.env.FIXIE_USERNAME,
        password: process.env.FIXIE_PASSWORD,
      },
    };

    // Send a request to ASP
    const response = await axios.get(aspWebhookUrl, { proxy });

    console.log("Webhook sent successfully:", response.data);
    res.status(200).json({ message: "Webhook sent successfully" });

  } catch (error) {
    console.error("Error sending webhook:", error.message);
    res.status(500).json({ error: "Failed to send webhook" });
  }
});

// Server Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});