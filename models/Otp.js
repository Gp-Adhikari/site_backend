//imports
const mongoose = require("mongoose");

//mongoose schema
const otpSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: Date.now(),
    index: {
      expires: "5m",
    },
  },
});

mongoose.model("Otp", otpSchema);
