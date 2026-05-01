const router = require("express").Router();
const controller = require("../controllers/doctorController");
const upload = require("../middleware/uploadMiddleware");

router.get("/", controller.listDoctors);
router.post("/", upload.single("photo"), controller.createDoctor);
router.get("/:id", controller.getDoctor);
router.put("/:id", upload.single("photo"), controller.updateDoctor);
router.delete("/:id", controller.deleteDoctor);

module.exports = router;