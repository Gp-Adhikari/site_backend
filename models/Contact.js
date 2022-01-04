const mongoose = require('mongoose');

const ContactSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: 50
    },
    email: {
        type: String,
        required: true,
        maxLength: 100
    },
    ph: {
        type: Number,
        required: true,
        maxLength: 20
    },
    subject: {
        type: String,
        required: true,
        maxLength: 150
    },
    message: {
        type: String,
        required: true,
        maxLength: 1000
    }

});

mongoose.model('Contact', ContactSchema);