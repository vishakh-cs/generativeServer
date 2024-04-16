var express = require('express');
const userAuth = require('../controller/userAuth')
var router = express.Router();


router.post('/signup',userAuth.signUp)

router.post('/login',userAuth.Login)

router.post('/googlelogin',userAuth.googlelogin);

router.post('/set-token',userAuth.setToken);

router.post('/verifyEmail',userAuth.verifyEmail);

router.post('/new-workspace',userAuth.createNewWorkSpace);

router.post('/checkHaveWorkspace',userAuth.checkWorkspace);

router.get('/verify',userAuth.verifyEmail);

// router.post('/checkNewWorkspace', userAuth.checkNewWorkspaceorNot);

router.post('/setProfileImageUrl',userAuth.setProfileUrl);

router.post('/forgotpassword',userAuth.ForgotPasswordEmailVerify);

router.post('/verifyforgototp',userAuth.verifyForgotOtp);

router.post('/forgotresetpassword',userAuth.forgotResetPassword);







module.exports = router;
