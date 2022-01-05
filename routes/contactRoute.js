const express = require("express");

const mongoose = require("mongoose");
const Contact = mongoose.model("Contact");

const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

router.get("/contact", authenticateToken, (req, res) => {
  try {
    Contact.find({}, (err, contacts) => {
      if (err)
        return res
          .status(400)
          .json({ status: false, message: "Something went wrong!" });
      else {
        return res
          .status(200)
          .json({ status: true, path: "/contact", contacts });
      }
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Something went wrong!" });
  }
});

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

router.post("/contact", (req, res) => {
  try {
    const { name, email, ph, subject, message } = req.body;

    if (!validateEmail(email))
      return res
        .status(400)
        .json({ message: "Please enter valid Email.", status: false });

    const contact = new Contact({
      name: String(name),
      email: String(email),
      ph: parseInt(ph),
      subject: String(subject),
      message: String(message),
    });

    contact.save((err) => {
      return err
        ? res
            .status(400)
            .json({ message: "Something went wrong!", status: false })
        : res.status(200).json({ message: "message sent!", status: true });
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Something went wrong!", status: false });
  }
});

router.delete("/contact/:id", authenticateToken, (req, res) => {
  const id = req.params.id;

  if (id === undefined)
    return res.status(400).json({ message: "ID missing.", status: false });
  try {
    Contact.findById(String(id)).deleteOne((err, contact) => {
      if (err)
        return res
          .status(400)
          .json({ message: "Something went wrong!", status: false });
      else {
        if (contact.deletedCount) {
          return res.status(200).json({
            Removed: contact.deletedCount,
            message: "contact removed!",
            status: true,
          });
        } else {
          return res
            .status(400)
            .json({ message: "Something went wrong!", status: false });
        }
      }
    });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Something went wrong!", status: false });
  }
});

module.exports = router;
