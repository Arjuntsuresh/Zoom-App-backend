const mongoose = require('mongoose');

const dataSchema  = new mongoose.Schema({
    date:{
        type:Date,
        required:true
    },
    time:{
        type:String,
        required:true
    },
    meetingUrl:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    meetingId:{
        type:String,
        required:true
    }
});

const dataModel = mongoose.model('Data', dataSchema)

module.exports  = dataModel;