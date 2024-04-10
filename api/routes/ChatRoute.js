var express = require('express');
const userAuth = require('../controller/userAuth')
const chatController = require('../controller/ChatController');
var router = express.Router();

router.post("/chat",chatController.createChat);
router.get("/chatUser/:userId",chatController.userChats)
router.get("/findChat/:firstId/:secondId",chatController.findChat)

module.exports = router;
