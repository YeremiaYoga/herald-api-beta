const express = require("express");
const path = require("path");
const cors = require("cors"); // Import CORS
const app = express();
const port = 3000;
const data = require("./data");
const axios = require("axios");
const fs = require("fs");
const PORT = process.env.PORT || 3000;

app.use(cors());

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
