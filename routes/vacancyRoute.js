const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");
const VacancyAnnouncement = mongoose.model("VacancyAnnouncement");
const VacancyApplicant = mongoose.model("VacancyApplicant");

const VacancyAppliedRequirement = require("../middleware/VacancyAppliedRequirements");
const authenticateToken = require("../middleware/authenticateToken");

const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/vacancy", (req, res) => {
  try {
    VacancyAnnouncement.find({}, (err, vacancies) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Something went wrong!", status: false });
      }
      return res.status(200).json({ status: true, vacancies: vacancies });
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Something went wrong!", status: false });
  }
});

router.post("/vacancy/announcement", authenticateToken, (req, res) => {
  try {
    const { title, corporateTitle, noOfVacancy, requirements, salary, type } =
      req.body;

    if (title === undefined || type === undefined)
      return res.json({ error: "Something went wrong!" });

    const requirementsArray = String(requirements).split("\\");

    const vacancy = new VacancyAnnouncement({
      title: String(title),
      corporateTitle: String(corporateTitle),
      noOfVacancy: parseInt(noOfVacancy),
      requirements: requirementsArray,
      salary: String(salary),
      type: parseInt(type),
    });

    vacancy.save((err) => {
      err
        ? res
            .status(400)
            .json({ status: false, message: "Something went wrong!" })
        : res
            .status(200)
            .json({ status: true, message: "Added Successfully!" });
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Something went wrong!", status: false });
  }
});

router.delete("/vacancy/:id", authenticateToken, (req, res) => {
  try {
    const id = String(req.params.id);
    VacancyAnnouncement.find({ _id: id }).deleteOne((err, msg) => {
      if (err)
        return res
          .status(400)
          .json({ status: false, message: "Something went wrong!" });

      return res.status(200).json({
        status: true,
        Removed: msg.deletedCount,
        message: "Removed.",
      });
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Something went wrong!" });
  }
});

// vacancy applicants
router.get("/vacancy/applicants", authenticateToken, (req, res) => {
  try {
    VacancyApplicant.find({}, (err, applicants) => {
      return err
        ? res
            .status(400)
            .json({ status: false, message: "Something went wrong!" })
        : res.status(200).json({ status: true, applicants: applicants });
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Something went wrong!" });
  }
});

router.get("/vacancy/applicants/:id", authenticateToken, (req, res) => {
  try {
    const id = String(req.params.id);

    if (id !== undefined) {
      VacancyApplicant.findById(id, (err, result) => {
        if (err)
          return res.json({ status: false, message: "Data doesn't exists!" });
        else {
          if (result.vacancyAnnouncedID) {
            let name;
            VacancyAnnouncement.findById(
              result.vacancyAnnouncedID,
              (err, data) => {
                err ? (name = "Removed.") : (name = data.title);

                return res.json({
                  status: true,
                  appliedForTitle: name,
                  result: result,
                });
              }
            );
          } else {
            return res
              .status(400)
              .json({ status: false, message: "Something went wrong!" });
          }
        }
      });
    } else {
      return res.status(200).json({ status: false, message: "Id is missing!" });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Something went wrong!" });
  }
});

router.post("/vacancy/applicants", rateLimiter, (req, res) => {
  try {
    VacancyAppliedRequirement.single("file")(req, res, function (err) {
      if (req.body.applicantName === "") {
        res.json({ status: false, message: "Name field is empty!" });
      } else if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.json({ status: false, message: "PDF only." });
      } else if (err) {
        // An unknown error occurred when uploading.
        res.json({ status: false, message: "PDF only." });
      }

      if (req.file.filename) {
        const filename = req.file.filename;
        const { vacancyAnnouncedID, applicantName, email, ph, address, desc } =
          req.body;

        const applicant = new VacancyApplicant({
          vacancyAnnouncedID: String(vacancyAnnouncedID),
          applicantName: String(applicantName),
          email: String(email),
          ph: parseInt(ph),
          address: String(address),
          desc: String(desc),
          file: filename,
        });
        applicant.save((err) => {
          return err
            ? res
                .status(400)
                .json({ status: false, message: "Something went wrong!" })
            : res.json({ status: true, message: "success" });
        });
      } else {
        const { vacancyAnnouncedID, applicantName, email, ph, address, desc } =
          req.body;

        const applicant = new VacancyApplicant({
          vacancyAnnouncedID: String(vacancyAnnouncedID),
          applicantName: String(applicantName),
          email: String(email),
          ph: parseInt(ph),
          address: String(address),
          desc: String(desc),
        });
        applicant.save((err) => {
          return err
            ? res
                .status(400)
                .json({ status: false, message: "Something went wrong!" })
            : res.json({ status: true, message: "success" });
        });
      }
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Something went wrong!" });
  }
});

router.delete("/vacancy/applicants", authenticateToken, (req, res) => {
  try {
    const filename = String(req.body.id);

    VacancyApplicant.find({ file: filename }).deleteMany((err, result) => {
      if (err)
        return res
          .status(400)
          .json({ status: false, message: "Something went wrong!" });
      else {
        if (
          fs.existsSync(
            path.join(__dirname, `../public/AppliedApplicant/${filename}`)
          )
        ) {
          fs.stat(
            path.join(__dirname, `../public/AppliedApplicant/${filename}`),
            (err, stats) => {
              if (err) {
                return res
                  .status(400)
                  .json({ status: false, message: "Something went wrong!" });
              }

              fs.unlink(
                path.join(__dirname, `../public/AppliedApplicant/${filename}`),
                (err) => {
                  if (err)
                    return res.status(400).json({
                      status: false,
                      message: "Something went wrong!",
                    });
                }
              );
            }
          );
          return res.json({
            status: true,
            message: "Removed.",
            Removed: result.deletedCount,
          });
        } else {
          if (result.deletedCount >= 0) {
            return res.json({
              status: true,
              message: "Removed.",
              Removed: result.deletedCount,
            });
          } else {
            return res.json("No data found");
          }
        }
      }
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Something went wrong!",
    });
  }
});

module.exports = router;
