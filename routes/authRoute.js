require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const generateAccessToken = require("../middleware/generateAccessToken");

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
router.post("/login", (req, res) => {
  try {
    //Auth
    const username = String(req.body.username);
    const password = String(req.body.password);

    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const user = { name: username };

      const accessToken = generateAccessToken(user);
      const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

      refreshTokens.push(refreshToken);

      //set refresh token as httponly cookie
      res.cookie("token", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        secure: false,
      });

      return res.status(200).json({ accessToken: accessToken });
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Username or password is incorrect." });
    }
  } catch (error) {
    return res
      .status(401)
      .json({ status: false, message: "Something went wrong." });
  }
});
//generate new access token after expired
router.get("/token", (req, res) => {
  try {
    const refreshToken = getAppCookies(req).token;

    if (!refreshTokens.includes(refreshToken))
      return res
        .status(400)
        .json({ status: true, message: "Something went wrong!" });

    jwt.verify(
      String(refreshToken),
      process.env.REFRESH_TOKEN_SECRET,
      (err, user) => {
        const accessToken = generateAccessToken({ name: user.name });
        return res.status(200).json({ accessToken: accessToken });
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
