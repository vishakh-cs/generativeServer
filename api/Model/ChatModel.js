const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({
    users:{
        type:Array,

    },
},{
    timestamps: true 
})

const ChatModel = mongoose.model("Chat", ChatSchema);
module.exports = ChatModel