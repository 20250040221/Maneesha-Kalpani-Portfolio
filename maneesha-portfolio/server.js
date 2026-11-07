const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const imagesDir = path.join(publicDir, "images");

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const maxFileSize = 2 * 1024 * 1024;

fs.mkdirSync(imagesDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, imagesDir);
    },
    filename: (req, file, callback) => {
      const originalName = (file.originalname || "profile-image")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const extension = path.extname(originalName);
      const safeExtension = allowedExtensions.includes(extension)
        ? extension
        : ".png";
      callback(null, `profile-${Date.now()}${safeExtension}`);
    },
  }),
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isMimeTypeAllowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ].includes(file.mimetype);

    if (isMimeTypeAllowed && allowedExtensions.includes(extension)) {
      callback(null, true);
      return;
    }

    callback(
      new Error("Only JPG, JPEG, PNG, and WEBP files up to 2MB are allowed.")
    );
  },
});

app.disable("x-powered-by");
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.post("/upload-profile", (req, res) => {
  upload.single("profilePhoto")(req, res, (error) => {
    if (error) {
      const message =
        error instanceof multer.MulterError
          ? error.message
          : error.message || "Upload failed.";
      res.status(400).json({ error: message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "Please choose a valid image file first." });
      return;
    }

    const imageUrl = `/images/${req.file.filename}`;
    res.status(200).json({
      message: "Profile photo updated successfully.",
      imageUrl,
    });
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, "404.html"));
});

app.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
});