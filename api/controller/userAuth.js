const express = require('express');
const UserModel = require('../Model/userCollection');
const Workspace = require('../Model/workspaceSchema');
const crypto = require('crypto');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const cookie = require('cookie');



const createToken = (_id) => {
  const jwtKey = process.env.JWT_SECRET;
  return jwt.sign({ _id }, jwtKey, { expiresIn: "3d" });
}


// Schedule a task to run every 3 minute
cron.schedule('* * * * *', async () => {
  try {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    await UserModel.deleteMany({
      isVerified: false,
      createdAt: { $lt: threeMinutesAgo }
    });

    console.log('Deleted unverified users older than  3 minutes.');
  } catch (error) {
    console.error('Error deleting unverified users:', error);
  }
});

const signUp = async (req, res) => {
  try {
    const { UserName, phonenumber, email, password, confirmPassword } = req.body;

    // Check if the email is already registered
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered but not verified. Verification email has been sent.',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered and verified.',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailToken = crypto.randomBytes(64).toString('hex');

    const newUser = new UserModel({
      username: UserName,
      phone: phonenumber,
      email,
      password: hashedPassword,
      emailToken,
      hasEmailToken: true,
    });

    await newUser.save();

    console.log('User saved successfully.');

    // Send verification email
    const verificationLink = `${process.env.BASE_URL}/verify?token=${emailToken}`;
    const emailTemplatePath = path.join(__dirname, '../public/EmailVerify/emailVerify.html');
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');
    const emailContent = emailTemplate.replace(/{username}/g, UserName).replace(/{verificationLink}/g, verificationLink);

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "Generative",
      to: email,
      subject: 'Email Verification',
      html: emailContent,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send('Error sending email');
      } else {
        console.log('Email sent:', info.response);
      }
    });
    return res.status(200).json({
      success: true,
      message: 'User signed up successfully.',
      user: {
        username: newUser.username,
        email: newUser.email,

      },
    });
  } catch (error) {
    console.error('Error during sign-up:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error during sign-up',
    });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) return res.status(404).json("email not found ...");

    const user = await UserModel.findOne({ emailToken: token });
    if (user) {
      user.emailToken = null;
      user.isVerified = true;
      user.save();
      const acceptHeader = req.headers.accept || "";
      const isHtmlRequest = acceptHeader.includes("text/html");

      if (isHtmlRequest) {

        return res.redirect(302, '../EmailVerify/redirectpage/redirectPage.html');
      } else {
        return res.status(200).json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token,
            isVerified: user?.isVerified,
          },
          message: "Email verification successful.",
        });
      }
    } else {
      return res.status(404).json({ success: false, message: "Email verification failed. Invalid token." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};



const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please check your email for verification instructions.',
      });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const hasWorkspace = user.have_workspace;
    let workspaceId = null;

    if (hasWorkspace) {
      const workspace = await Workspace.findOne({ owner: user._id });
      if (workspace) {
        workspaceId = workspace._id;
      }
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'strict',
    });

    const responseData = {
      success: true,
      message: 'Login successful.',
      user: {
        userid: user._id,
        username: user.username,
        email: user.email,
        hasWorkspace,
        workspaceId,
      },
      token: token,
    };

    if (hasWorkspace) {
      responseData.redirectUrl = `/home/${user._id}/${workspaceId}`;
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error during login:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error during login',
    });
  }
};


const googlelogin = async (req, res) => {
  console.log("hii");
  try {
    const { email, userName } = req.body;

    // Check if the email is already registered
    let user = await UserModel.findOne({ email });

    if (!user) {
      user = new UserModel({
        email,
        username: userName,
        isVerified: true,
      });
      await user.save();

      console.log('New user saved successfully.');
    } else {
      user.isVerified = true;
      await user.save();
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const hasWorkspace = user.have_workspace;
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.status(200).json({
      success: true,
      message: 'User authenticated successfully.',
      token,
      user: {
        email: user.email,
        username: user.username,
        hasWorkspace,
      },
      redirectUrl: hasWorkspace ? '/home' : '/new-workspace',
    });
  } catch (error) {
    console.error('Error during Google login:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error during Google login',
    });
  }
};

const setToken = (req, res) => {
  try {
    const { userId, email } = req.body;
    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      message: 'Token generated successfully.',
      token,
    });
  } catch (error) {
    console.error('Error setting token:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error setting token',
    });
  }
};

const checkWorkspace = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (user) {
      const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });


      const workspace = await Workspace.findOne({ owner: user._id });
      console.log("im wkr",workspace);

       // Find the workspace where the user is a collaborator
       collaboratorWorkspace = await Workspace.findOne({ collaborators: user._id });

       console.log("collaboratorWorkspace",collaboratorWorkspace);

      res.json({
        id:user._id,
        userEmail:user.email,
        hasWorkspace: user.have_workspace,
        workspaceId: workspace ? workspace._id : null,
        collaboratorWorkspace: collaboratorWorkspace || null,
        token: token,
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error checking workspace:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const createNewWorkSpace = async (req, res) => {
  try {

    let userEmail ;

    // Check if the request have user
    if (req.body.user) {
      userEmail = req.body.user.email;
      console.log("ujjnd", userEmail);
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Missing or invalid Authorization header.',
        });
      }

      // Extract the token from the headers
      const token = authHeader.split(' ')[1];
      console.log("tah", token);

      // Verify the token and extract the user email
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decodedToken);

      userEmail = decodedToken.email;
      console.log("ujjnd", userEmail);
    }

    // Validate if the required data is present
    const { imageIndex, workspaceName } = req.body;
    if (!userEmail || !imageIndex || !workspaceName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Missing required data.',
      });
    }

    const user = await UserModel.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.have_workspace = true;
    user.save();
    const newWorkspace = new Workspace({
      name: workspaceName,
      workspaceLogoIndex: imageIndex,
      owner: user._id,
      type: 'private',
    });

    await newWorkspace.save();

    return res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      workspace: {
        name: newWorkspace.name,
        owner: newWorkspace.owner,
        type: newWorkspace.type,
        createdAt: newWorkspace.createdAt,
        workspaceId: newWorkspace._id,
      },
      userId: user._id,
    });
  } catch (error) {
    console.error('Error creating workspace:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error creating workspace',
    });
  }
};

const setProfileUrl=async(req,res)=>{
  const { profileImage ,emailId } = req.body;

  try {
    const updatedUser = await UserModel.findOneAndUpdate({ email: emailId }, { profileImageUrl: profileImage }, { new: true });

    if (updatedUser) {
      return res.json({ success: true, message: 'Profile image URL updated successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error setting profile image URL:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const ForgotPasswordEmailVerify=async(req,res)=>{
  const {email} = req.body;
     const user = await UserModel.findOne({ email });
 if (!user) {
  return res.status(404).json({ success: false, message: 'User not found' });
}
  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  const emailTemplatePath = path.join(__dirname, '../public/ForgotPasswordVerification/forgotPass.html');
  const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');
  const emailContent = emailTemplate.replace(/{email}/g, email).replace(/{verificationCode}/g, verificationCode);
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: "Generative",
    to: email,
    subject: 'Forgot password Email Verification',
    html: emailContent,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent:', info.response);
      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        verificationCode: verificationCode  
      });
    }
  });
};

const verifyForgotOtp = async (req, res) => {
  try {
    // Extract the OTP from the request
    const { otp, email, verificationCode } = req.body;
  console.log("req.bodyreq.body",req.body);
    if (!otp || !verificationCode) {
      return res.status(400).json({ success: false, message: 'OTP and verification code are required' });
    }

    if (otp === verificationCode) {
      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error in verifyForgotOtp:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
const forgotResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await UserModel.findOneAndUpdate({ email }, { password: hashedPassword });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error.message);
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

 


module.exports = {
  signUp,
  Login,
  googlelogin,
  setToken,
  verifyEmail,
  createNewWorkSpace,
  checkWorkspace,
  setProfileUrl,
  ForgotPasswordEmailVerify,
  verifyForgotOtp,
  forgotResetPassword,
};
