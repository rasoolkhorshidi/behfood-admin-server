const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// storage with unique filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}); // 5MB

// Accept any field name (e.g. 'file' or 'image') and return a consistent response
exports.uploadImage = [
  upload.any(),
  (req, res) => {
    const file = (req.files && req.files[0]) || req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    // Optionally: save metadata to DB here (product/store association)

    res.json({
      filename: file.filename,
      url,
      path: `/uploads/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
    });
  },
];

exports.deleteImage = (req, res) => {
  try {
    let candidate = null;

    // Prefer URL param: DELETE /uploads/:filename
    if (req.params && req.params.filename) {
      candidate = decodeURIComponent(req.params.filename);
    }

    // Allow DELETE /uploads with JSON body { url, path, filename, fileName, response }
    if (!candidate && req.body) {
      if (req.body.filename) candidate = req.body.filename;
      else if (req.body.fileName) candidate = req.body.fileName;
      else if (req.body.path) candidate = req.body.path;
      else if (req.body.url) candidate = req.body.url;
      else if (req.body.response) {
        if (typeof req.body.response === "string")
          candidate = req.body.response;
        else if (req.body.response.filename)
          candidate = req.body.response.filename;
        else if (req.body.response.fileName)
          candidate = req.body.response.fileName;
      }
    }

    if (!candidate)
      return res.status(400).json({ message: "No filename or url provided" });

    // If a full URL or a path containing /uploads/ was provided, extract the filename
    if (candidate.includes("/uploads/")) {
      const idx = candidate.indexOf("/uploads/");
      candidate = candidate.substring(idx + "/uploads/".length);
    }

    // strip query string
    candidate = candidate.split("?")[0];

    // Use basename to avoid directory segments
    const filename = path.basename(candidate);

    const resolved = path.resolve(UPLOAD_DIR);
    const target = path.resolve(path.join(UPLOAD_DIR, filename));

    // Prevent path traversal: target must live inside UPLOAD_DIR
    if (!target.startsWith(resolved)) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    if (!fs.existsSync(target)) {
      return res.status(404).json({ message: "File not found" });
    }

    fs.unlinkSync(target);
    return res.json({ message: "File deleted", filename });
  } catch (err) {
    console.error("deleteImage error:", err);
    return res.status(500).json({ message: "Error deleting file" });
  }
};
