const multer = require("multer");

// set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// init upload
const upload = multer({
  storage: storage,
}).single("file");

module.exports = upload;
