const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const mime = require("mime");

const mongoose = require("mongoose");
const Portfolio = mongoose.model("Portfolio");

const PortfolioImgRequirement = require("../middleware/PortfolioImgRequirements");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

/***********************************/
const root = "../public/images/";
const validatePath = (user_input, res) => {
  try {
    if (user_input.indexOf("\0") !== -1) {
      return res.status(401).json({
        status: false,
        message: "Sneeky ?? We're not dumb like you idiot.",
      });
    }
    if (!/^[A-Za-z0-9\-]+$/.test(user_input)) return;

    const safe_input = path
      .normalize(user_input)
      .replace(/^(\.\.(\/|\\|$))+/, "");

    const path_string = path.join(root, safe_input);
    if (path_string.indexOf(root) !== -1) {
      return res.status(401).json({
        status: false,
        message: "Sneeky ?? We're not dumb like you idiot.",
      });
    }

    return (validPath = {
      path: String(path_string + ".png"),
      filename: String(safe_input + ".png"),
    });
  } catch (error) {
    return res.status(401).json({
      message: "Something went wrong!",
      status: false,
    });
  }
};
/***********************************/

router.get("/portfolio", (req, res) => {
  try {
    Portfolio.find({}, (err, portfolios) => {
      return err
        ? res
            .status(400)
            .json({ message: "Something went wrong!", status: false })
        : res
            .status(200)
            .json({ path: "/portfolio", portfolios, status: true });
    });
  } catch (error) {
    res.status(403).json({ message: "Something went wrong!", status: false });
  }
});

router.get("/photo/:pic", (req, res) => {
  try {
    const filePath = req.params.pic;

    const sanitizedFilePath = validatePath(filePath, res);

    return res.sendFile(path.join(__dirname, sanitizedFilePath.path), (err) => {
      if (err) {
        return res
          .status(404)
          .json({ status: false, message: "Image Not Found!" });
      }
    });
  } catch (error) {
    return res.status(404).json({ status: false, message: "Image Not Found!" });
  }
});

router.post("/api/portfolio", authenticateToken, (req, res) => {
  PortfolioImgRequirement.single("img")(req, res, function (err) {
    if (req.body.name === "" || req.body.link === "") {
      return res
        .status(400)
        .json({ status: false, message: "Name or link field is empty!" });
    } else if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({
        message: "JPG, JPeG & PNG only and file size should be less than 2MB.",
        status: false,
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({
        message: "JPG, JPeG & PNG only and file size should be less than 2MB.",
        status: false,
      });
    }

    try {
      const filename = req.file.filename;
      const name = String(req.body.name);
      const link = String(req.body.link);
      const desc = String(req.body.desc);
      const type = parseInt(req.body.type);

      const portfolio = new Portfolio({
        img: String(filename),
        name: name,
        link: link,
        desc: desc,
        type: type,
      });

      const sanitizedFilePath = validatePath(req.file.filename, res);

      portfolio.save((err) => {
        if (err) {
          try {
            if (fs.existsSync(path.join(__dirname, sanitizedFilePath.path))) {
              fs.unlinkSync(path.join(__dirname, sanitizedFilePath.path));
            }
          } catch (error) {
            return res
              .status(404)
              .json({ status: false, message: "Image Not Found!" });
          }

          return res
            .status(400)
            .json({ message: "Something went wrong!", status: false });
        } else {
          return res.status(200).json({ message: "success", status: true });
        }
      });
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Something went wrong!", status: false });
    }
  });
});

router.delete("/portfolio/:portfolio", (req, res) => {
  try {
    const id = String(req.params.portfolio);

    const sanitizedFilePath = validatePath(id, res);

    Portfolio.find({ img: sanitizedFilePath.filename }).deleteMany(
      (err, result) => {
        if (err) {
          return res
            .status(400)
            .json({ message: "Something went wrong!", status: false });
        } else {
          if (fs.existsSync(path.join(__dirname, sanitizedFilePath.path))) {
            fs.stat(
              path.join(__dirname, sanitizedFilePath.path),
              (err, stats) => {
                if (err) {
                  return res
                    .status(400)
                    .json({ message: "Something went wrong!", status: false });
                }

                fs.unlink(
                  path.join(__dirname, sanitizedFilePath.path),
                  (err) => {
                    if (err)
                      return res.status(400).json({
                        message: "Something went wrong!",
                        status: false,
                      });
                  }
                );
              }
            );
            res.json({
              Removed: result.deletedCount,
              message: "Portfolio removed.",
              status: true,
            });
          } else {
            res.status(200).json({ message: "No data found", status: false });
          }
        }
      }
    );
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Something went wrong!", status: false });
  }
});

module.exports = router;
