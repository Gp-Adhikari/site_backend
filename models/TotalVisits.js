//imports
const mongoose = require("mongoose");

//mongoose schema
const TotalVisitSchema = new mongoose.Schema({
  visit: {
    type: Number,
    required: true,
    default: 0,
  },
});

mongoose.model("TotalVisit", TotalVisitSchema);
