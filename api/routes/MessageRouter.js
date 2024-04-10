var express = require('express');
const userAuth = require('../controller/userAuth')
const chatController = require('../controller/ChatController');
const messageController = require('../controller/MessageController')
var router = express.Router();

router.post('/addMessage',messageController.addMessage);
router.get('/getMessage/:chatId',messageController.getMessages);

module.exports = router;