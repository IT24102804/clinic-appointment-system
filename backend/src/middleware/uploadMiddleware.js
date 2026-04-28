const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer — save to temp uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

// profile upload — images only, max 2MB
const profileUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG allowed for profile pictures"));
    }
  },
}).single("profileImage");

// document upload — images + PDF, max 5MB
const documentUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and PDF allowed for documents"));
    }
  },
}).single("document");

// upload file to cloudinary then delete temp file
const uploadToCloudinary = async (filePath, folder) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder,
  });
  fs.unlinkSync(filePath); // delete temp file immediately after upload
  return result.secure_url; // return cloudinary URL to save in MongoDB
};

// delete image from cloudinary using its URL
const deleteFromCloudinary = async (imageUrl) => {
  try {
    const urlParts = imageUrl.split("/");
    const folderAndFile = urlParts.slice(-2).join("/"); // folder/filename
    const publicId = folderAndFile.split(".")[0]; // remove extension
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

module.exports = {
  profileUpload,
  documentUpload,
  uploadToCloudinary,
  deleteFromCloudinary,
};