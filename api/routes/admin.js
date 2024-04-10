var express = require('express');
const userAuth = require('../controller/userAuth')
var router = express.Router();
var adminAuth = require('../controller/adminAuth')


router.post('/admin-login',adminAuth.login)

router.get('/userdata',adminAuth.userManagement)

router.post('/blockuser/:userId', adminAuth.blockUser);

router.get('/searchuser/:searchTerm',adminAuth.searchUsers);


module.exports = router;
