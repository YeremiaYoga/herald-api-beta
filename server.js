const express = require("express");
const path = require("path");
const cors = require("cors"); // Import CORS
const app = express();
const port = 3000;
const data = require("./data");
const axios = require("axios");
const fs = require("fs");
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const corsOptions = {
  origin: "http://localhost:30000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/data", express.static(path.join(__dirname, "data")));

app.get("/api/data", (req, res) => {
  res.json(data);
});

app.get("/auth/patreon", (req, res) => {
  const clientId = process.env.PATREON_CLIENT_ID;
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  // URL Patreon untuk otorisasi OAuth
  const authorizationUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;

  // Redirect pengguna ke Patreon
  res.redirect(authorizationUrl);
});

app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code not provided.");
  }

  try {
    // Menggunakan axios untuk mendapatkan token dari Patreon
    const tokenResponse = await axios.post(
      "https://www.patreon.com/api/oauth2/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code: code,
          client_id: process.env.PATREON_CLIENT_ID,
          client_secret: process.env.PATREON_CLIENT_SECRET,
          redirect_uri: process.env.PATREON_REDIRECT_URI,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Opsional: Mengambil data pengguna menggunakan access token
    const userDataResponse = await axios.get(
      "https://www.patreon.com/api/oauth2/v2/identity",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = userDataResponse.data;
    console.log("User data:", userData); // Data pengguna dari Patreon

    // Redirect kembali ke aplikasi Foundry atau tampilkan data pengguna
    res.redirect(
      `http://localhost:30000?user=${encodeURIComponent(
        JSON.stringify(userData)
      )}`
    );
  } catch (error) {
    console.error("OAuth process failed:", error.message);
    res.status(500).send("Authentication failed: " + error.message);
  }
});




app.get("/download", async (req, res) => {
  const { url } = req.query;

  console.log(url);

  if (!url) {
    return res.status(400).send("No URL provided");
  }

  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
    });

    const totalLength = response.headers["content-length"];
    let downloadedLength = 0;

    res.setHeader("Content-Type", response.headers["content-type"]);

    response.data.on("data", (chunk) => {
      downloadedLength += chunk.length;
      const progress = ((downloadedLength / totalLength) * 100).toFixed(2);
      console.log(`Download progress: ${progress}%`);
    });

    response.data.pipe(res);

    response.data.on("end", () => {
      console.log("Download complete");
    });

    response.data.on("error", (error) => {
      console.error("Error during download:", error);
      res.status(500).send("Error during download");
    });
  } catch (error) {
    console.error("Download failed:", error.message);
    res.status(500).send("Download failed: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
