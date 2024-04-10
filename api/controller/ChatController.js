const ChatModel = require('../Model/ChatModel');


const createChat = async(req,res)=>{
    const newChat =  new ChatModel({
        users:[req.body.senderId,req.body.receiverId]
    });
    try {
        const result = await newChat.save();
        res.status(200).json(result);
        
    } catch (error) {
        res.status(500).json(error)
        
    }
}

const userChats = async (req, res) => {
    console.log("req.params.userId", req.params.userId);
    try {
        // Check if any chat exists for the specified user ID(s)
        let chat = await ChatModel.find({
            users: { $in: [req.params.userId] }
        });

        if (chat.length === 0) {
            // If no chat exists, create a new one
            const newChat = new ChatModel({
                users: [req.body.senderId, req.body.receiverId]
            });

            // Save the newly created chat to the database
            const savedChat = await newChat.save();

            // Respond with the newly created chat
            res.status(200).json(savedChat);
        } else {
            // If chat(s) exist, respond with the existing chat(s)
            res.status(200).json(chat);
        }
    } catch (error) {
        res.status(500).json(error);
    }
}





const findChat = async(req,res)=>{
    try {
        const chat = await ChatModel.findOne({
              users: {$all: [req.params.firstId , req.params.secondId ]}
        })
        res.status(200).json(chat);
        
    } catch (error) {
        res.status(500).json(error)
        
    }
}

module.exports = {
    createChat,
    userChats,
    findChat,


}