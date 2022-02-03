const path = require("path");
const uuid = require("uuid").v4;
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/AppliedApplicant/");
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    const originalname = `${uuid()}${ext}`;
    cb(null, originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (file.mimetype == "application/pdf") {
      callback(null, true);
    } else {
      callback(new Error("PDF only."));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
});

module.exports = upload;
