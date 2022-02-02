//imports
const mongoose = require("mongoose");

//mongoose schema
const PageVisitSchema = new mongoose.Schema({
  counter: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: Date.now(),
    index: {
      expires: "7d",
    },
  },
});

mongoose.model("PageVisit", PageVisitSchema);
