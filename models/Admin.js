const mongoose = require("mongoose");

const AdminSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    maxLength: 100,
  },
});

mongoose.model("Admin", AdminSchema);
