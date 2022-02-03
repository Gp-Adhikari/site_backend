const limitter = require("express-rate-limit");

const rateLimiter = limitter({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 20, //5 requests max
  message: {
    code: 429,
    status: false,
    message:
      "Too many submits from this IP, Please try again after 15 minutes.",
  },
});

module.exports = rateLimiter;
