const express = require("express");
const EjaanController = require("../controllers/EjaanController");
const AuthController = require("../controllers/AuthController");

const router = express.Router();

router.get("/", async (req, res) => res.json({ message: "Hello World" }));

router.post("/login", AuthController.Login);

// router.get("/kamus", EjaanController.getKamus);
router.post("/kamus", EjaanController.getKamus);
router.post("/deteksi-ejaan", EjaanController.deteksiEjaan);
router.post("/get-all-kamus", EjaanController.getAllKamus);
router.post("/upload-file", EjaanController.uploadFile);

router.post("/total-kamus", EjaanController.totalKamus);

router.post("/download-file", EjaanController.downloadFile);
router.post("/check-word", EjaanController.checkWord);

// dashboard
router.post("/tambah-kata", EjaanController.TambahKata);
router.post("/hapus-kata/:id", EjaanController.HapusKata);
router.post("/update-kata/:id", EjaanController.UpdateKata);

router.post('/add', EjaanController.add);

module.exports = router;
