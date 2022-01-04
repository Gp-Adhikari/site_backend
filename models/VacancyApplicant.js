const mongoose = require('mongoose');

const VacancyApplicantSchema = mongoose.Schema({
    vacancyAnnouncedID: {
        type: String,
        required: true
    },
    date : {
        type : Date,
        default: Date.now(),
        required : true,
        index: true
    },
    applicantName: {
        type: String,
        required: true,
        maxLength: 50
    },
    email: {
        type: String,
        required: true,
        maxLength: 50
    },
    ph: {
        type: Number,
        required: true,
        maxLength: 20
    },
    address: {
        type: String,
        required: true,
        maxLength: 100
    },
    desc: {
        type: String,
        required: true,
        maxLength: 500
    },
    file: {
        type: String,
        maxLength: 50
    }
});

mongoose.model('VacancyApplicant', VacancyApplicantSchema);