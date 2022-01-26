const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");
const VacancyAnnouncement = mongoose.model("VacancyAnnouncement");
const VacancyApplicant = mongoose.model("VacancyApplicant");

const VacancyAppliedRequirement = require("../middleware/VacancyAppliedRequirements");
const authenticateToken = require("../middleware/authenticateToken");

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

/**************************** Make it from here ******************************************/

// vacancy applicants
router.get("/vacancy/applicants", authenticateToken, (req, res) => {
  VacancyApplicant.find({}, (err, applicants) => {
    err
      ? res.json({ error: "Something went wrong!" })
      : res.json({ path: "/vacancy/applicants", applicants });
  });
});

router.get("/vacancy/applicants/:id", authenticateToken, (req, res) => {
  const id = req.params.id;

  if (id !== undefined) {
    VacancyApplicant.findById(id, (err, result) => {
      if (err) return res.json({ error: "Data doesn't exists!" });
      else {
        if (result.vacancyAnnouncedID) {
          let name;
          VacancyAnnouncement.findById(
            result.vacancyAnnouncedID,
            (err, data) => {
              err ? (name = "Removed.") : (name = data.title);

              return res.json({
                path: "/vacancy/applicants",
                appliedForTitle: name,
                result,
              });
            }
          );
        } else {
          return res.json({ error: "Something went wrong!" });
        }
      }
    });
  } else {
    res.json({ error: "Please send ID." });
  }
});

router.post("/vacancy/applicants", authenticateToken, (req, res) => {
  VacancyAppliedRequirement.single("file")(req, res, function (err) {
    if (req.body.applicantName === "") {
      res.json({ error: "Name field is empty!" });
    } else if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.json({ error: "PDF only." });
    } else if (err) {
      // An unknown error occurred when uploading.
      res.json({ error: "PDF only." });
    }

    if (req.body.filename) {
      const filename = req.file.filename;
      const { vacancyAnnouncedID, applicantName, email, ph, address, desc } =
        req.body;

      const applicant = new VacancyApplicant({
        vacancyAnnouncedID: vacancyAnnouncedID,
        applicantName: applicantName,
        email: email,
        ph: ph,
        address: address,
        desc: desc,
        file: filename,
      });
      applicant.save((err) => {
        err ? res.json(err) : res.json("success");
      });
    } else {
      const { vacancyAnnouncedID, applicantName, email, ph, address, desc } =
        req.body;

      const applicant = new VacancyApplicant({
        vacancyAnnouncedID: vacancyAnnouncedID,
        applicantName: applicantName,
        email: email,
        ph: ph,
        address: address,
        desc: desc,
      });
      applicant.save((err) => {
        err ? res.json(err) : res.json("success");
      });
    }
  });
});

router.delete("/vacancy/applicants", authenticateToken, (req, res) => {
  const filename = req.body.id;

  VacancyApplicant.find({ file: filename }).deleteMany((err, result) => {
    if (err) return res.json({ error: "Something went wrong!" });
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
              return res.json({ error: "Something went wrong!" });
            }

            fs.unlink(
              path.join(__dirname, `../public/AppliedApplicant/${filename}`),
              (err) => {
                if (err) return res.json({ error: "Something went wrong!" });
              }
            );
          }
        );
        res.json({ Removed: result.deletedCount });
      } else {
        if (result.deletedCount >= 0) {
          res.json({ Removed: result.deletedCount });
        } else {
          res.json("No data found");
        }
      }
    }
  });
});

module.exports = router;
