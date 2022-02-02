const mongoose = require("mongoose");

const PortfolioSchema = mongoose.Schema({
  img: {
    type: String,
    required: true,
    maxLength: 50,
  },
  name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  link: {
    type: String,
    required: true,
    maxLength: 500,
  },
  desc: {
    type: String,
    required: true,
    maxLength: 500,
  },
  type: {
    type: Number,
    required: true,
    maxLength: 1,
  },
});

mongoose.model("Portfolio", PortfolioSchema);
