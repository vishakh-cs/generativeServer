const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required:true
    },
    senderId: {
        type: String
    },
    text: {
        type: String,
    },
},
    {
        timestamps: true
      }
    );


const MessageModel = mongoose.model("message", MessageSchema);
module.exports = MessageModel;