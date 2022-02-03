const mongoose = require("mongoose");

const VacancyAnnouncementSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: 30,
  },
  corporateTitle: {
    type: String,
    maxLength: 100,
  },
  noOfVacancy: {
    type: Number,
    maxLength: 2,
  },
  date: {
    type: Date,
    default: Date.now(),
    required: true,
    index: true,
  },
  requirements: [
    {
      type: String,
    },
  ],
  salary: {
    type: String,
  },
  type: {
    type: Number,
    required: true,
    maxLength: 1,
  },
});

mongoose.model("VacancyAnnouncement", VacancyAnnouncementSchema);
