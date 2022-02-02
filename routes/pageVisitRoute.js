require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const authenticateToken = require("../middleware/authenticateToken");

const PageVisit = mongoose.model("PageVisit");

const router = express.Router();

router.get("/pageVisits", authenticateToken, async (req, res) => {
  try {
    let todayVisits = 0;
    let yesterdayVisits = 0;

    const pageVisits = await PageVisit.find({});
    pageVisits.map((visitsPerDay) => {
      //today's visits
      if (
        parseInt(new Date().getDate()) ===
        parseInt(visitsPerDay.createdAt.split("-")[0])
      ) {
        todayVisits = visitsPerDay.counter;
      }
      //yestarday's visits
      if (
        parseInt(new Date().getDate()) - 1 ===
        parseInt(visitsPerDay.createdAt.split("-")[0])
      ) {
        yesterdayVisits = visitsPerDay.counter;
      }
    });
    return res.status(200).json({
      status: true,
      todayVisits: todayVisits,
      yesterdayVisits: yesterdayVisits,
      pageVisits: pageVisits,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: true, message: "Something went wrong!" });
  }
});

module.exports = router;
