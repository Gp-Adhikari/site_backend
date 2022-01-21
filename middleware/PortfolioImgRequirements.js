// const path = require("path");
// const uuid = require("uuid").v4;
const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./public/images/");
//   },
//   filename: (req, file, cb) => {
//     // let ext = path.extname(file.originalname);
//     // const originalname = `${uuid()}${ext}`;
//     const originalname = `${uuid()}.png`;
//     cb(null, originalname);
//   },
// });

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      callback(null, true);
    } else {
      callback(new Error("JPG, JPeG & PNG only"));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
});

module.exports = upload;
