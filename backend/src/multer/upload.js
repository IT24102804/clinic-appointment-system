const multer            = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary        = require("./cloudinary");

// Store files directly on Cloudinary (not local disk)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "clinic-medical-records",   // folder name on Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type:  "auto",                     // auto-detect image or pdf
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are allowed"), false);
    }
  },
});

module.exports = upload;
