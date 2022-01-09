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

    const fileMimeType = mime.getType(
      path.join(__dirname + "/../public/images/" + filePath)
    );

    if (
      fileMimeType != "image/png" &&
      fileMimeType != "image/jpg" &&
      fileMimeType != "image/jpeg"
    ) {
      throw Error();
    }

    return res.sendFile(
      path.join(__dirname + "/../public/images/" + filePath),
      (err) => {
        if (err)
          return res
            .status(404)
            .json({ status: false, message: "Image Not Found!" });
      }
    );
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

      portfolio.save((err) => {
        if (err) {
          try {
            if (
              fs.existsSync(
                path.join(__dirname, `/../public/images/${filename}`)
              )
            ) {
              const fileMimeType = mime.getType(
                path.join(__dirname + "/../public/images/" + filePath)
              );

              if (
                fileMimeType != "image/png" &&
                fileMimeType != "image/jpg" &&
                fileMimeType != "image/jpeg"
              ) {
                throw Error();
              }

              const safe_path = path
                .normalize(filename)
                .replace(/^(\.\.(\/|\\|$))+/, "");

              fs.unlinkSync(
                path.join(__dirname, `/../public/images/${safe_path}`)
              );
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
    Portfolio.find({ img: id }).deleteMany((err, result) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Something went wrong!", status: false });
      } else {
        if (fs.existsSync(path.join(__dirname, `../public/images/${id}`))) {
          fs.stat(
            path.join(__dirname, `../public/images/${id}`),
            (err, stats) => {
              if (err) {
                return res
                  .status(400)
                  .json({ message: "Something went wrong!", status: false });
              }

              fs.unlink(
                path.join(__dirname, `../public/images/${id}`),
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
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Something went wrong!", status: false });
  }
});

module.exports = router;
