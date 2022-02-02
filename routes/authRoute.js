require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const generateAccessToken = require("../middleware/generateAccessToken");

const Admin = mongoose.model("Admin");
const Otp = mongoose.model("Otp");

const router = express.Router();

//store refresh token for admin
let refreshTokens = [];

//get single cookie from user
const getAppCookies = (req) => {
  // We extract the raw cookies from the request headers
  const rawCookies = req.headers.cookie.split("; ");
  // rawCookies = ['myapp=secretcookie, 'analytics_cookie=beacon;']

  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split("=");
    // parsedCookie = ['myapp', 'secretcookie'], ['analytics_cookie', 'beacon']
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  return parsedCookies;
};

//login
router.post("/login", async (req, res) => {
  try {
    //Auth
    const email = String(req.body.email);
    const code = req.body.code;

    const AdminExists = await Admin.findOne({ email: String(email) });

    if ((await AdminExists) === null) throw Error();

    //if the code exists on body
    if (code !== undefined) {
      try {
        const otpCodeOfAdminExists = await Otp.findOne({
          email: String(email),
        });

        if (
          otpCodeOfAdminExists === null ||
          otpCodeOfAdminExists.code !== String(code)
        )
          return res
            .status(400)
            .json({ status: false, message: "Invalid code." });

        await Otp.findOneAndDelete({ email: String(email) });

        const user = { name: String(email) };

        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

        refreshTokens.push(refreshToken);

        //set refresh token as httponly cookie
        res.cookie("token", refreshToken, {
          maxAge: 1000 * 60 * 60 * 24 * 30,
          httpOnly: true,
          secure: false,
        });

        return res.status(200).json({ status: true, accessToken: accessToken });
      } catch (error) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid code." });
      }
    }

    //if the code doesnt exist in the body
    try {
      const otpCodeOfAdmin = await Otp.findOne({ email: String(email) });

      if ((await otpCodeOfAdmin) === null) throw Error();

      return res
        .status(200)
        .json({ status: true, message: "Code sent Successfully!" });
    } catch (error) {
      const otpCode = crypto.randomBytes(6).toString("base64");

      const saveOtp = await Otp({
        code: otpCode,
        email: email,
      });

      //transfer email
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });

      //mailing option
      let mailOptions = {
        from: process.env.EMAIL,
        to: String(email),
        subject: "Verification Code",
        html: `<h3>Thanks for using our platform!</h3><p>The code is<p><br/><h1>${otpCode}</h1><br/><br/><p>Teams, Zpro</p>`,
      };

      //send the mail
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          return res
            .status(400)
            .json({ status: false, message: "Email doesn't exists!" });
        }

        await saveOtp.save();
        return res
          .status(200)
          .json({ status: true, message: "Code sent Successfully!" });
      });
    }
  } catch (error) {
    return res
      .status(401)
      .json({ status: false, message: "Permission Denied." });
  }
});

//generate new access token after expired
router.get("/token", (req, res) => {
  try {
    const refreshToken = getAppCookies(req).token;

    if (!refreshTokens.includes(String(refreshToken))) {
      return res
        .status(400)
        .json({ status: false, message: "Something went wrong!" });
    }

    jwt.verify(
      String(refreshToken),
      process.env.REFRESH_TOKEN_SECRET,
      (err, user) => {
        const accessToken = generateAccessToken({ name: user.name });
        return res.status(200).json({ status: true, accessToken: accessToken });
      }
    );
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Something went wrong.",
    });
  }
});

//logout
router.delete("/logout", (req, res) => {
  try {
    const refreshToken = getAppCookies(req).token;

    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.clearCookie("token");
    return res
      .status(200)
      .json({ status: true, message: "logged out successfully!" });
  } catch (error) {
    return res
      .status(400)
      .json({ status: false, message: "Something went wrong!" });
  }
});

module.exports = router;
