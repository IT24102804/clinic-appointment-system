const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { profileUpload } = require("../middleware/uploadMiddleware");

const {
  uploadProfilePicture,
  deleteProfilePicture,
  updateAccount,
  deleteAccount,
} = require("../controllers/userController");

router.put(
  "/profile/picture",
  protect,
  (req, res, next) => {
    profileUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  uploadProfilePicture
);
router.delete("/profile/picture", protect, deleteProfilePicture);
router.put("/account", protect, updateAccount);
router.delete("/account", protect, deleteAccount);

module.exports = router;
