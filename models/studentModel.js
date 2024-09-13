const mongoose = require('mongoose');

const studentSchema  = new mongoose.Schema({
    userName : {
        type: String,
        require : true,
    },
    email : {
        type: String,
        require : true,
    },
    password : {
        type: String,
        require : true,
    }
});

const studentModel = mongoose.model('Student', studentSchema);

module.exports  = studentModel;