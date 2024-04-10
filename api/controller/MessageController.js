const ChatModel = require('../Model/ChatModel');
const MessageModel = require("../Model/MessageModel")


const addMessage = async(req,res)=>{
    const {chatId,senderId,text}=req.body;
    const message = new MessageModel({
        chatId,
        senderId,
        text
    });
  try {
    const result = await message.save();
    res.status(200).json(result);
    
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}


const  getMessages=async(req,res)=>{
    const {chatId}=req.params;
    try {
        const result = await MessageModel.find({chatId});
        res.status(200).json(result);
        
    } catch (error) {
        console.log("Error : ", error);
        res.status(500).json(error);
        
    }
}




module.exports = {
    addMessage,
    getMessages,
}