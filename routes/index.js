const express = require("express");
const { body, validationResult } = require("express-validator")
const passport = require("passport");
const asyncHandler = require('express-async-handler');
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");

const router = express.Router();

async function isMember(req,res,next) {
    const chat = await Chat.findById(req.params.chatId);
    if (chat && chat.members.includes(req.user._id)) {
        return next()
    }
    return res.redirect(`/chat/${req.params.chatId}/join`);
}
// home page
router.get("/", asyncHandler(async (req,res,next) => {
    const messages = await Message.find({}).populate("author",'firstname lastname').exec();
    res.render("layout", {
        title:"Messages",
        messages: messages,
        user:req.user,
        chats:null
    });
}));
// sign up page
router.get("/sign-up", (req,res,next) => {
    res.render("sign-up");
});

router.post("/sign-up",[
    // body verification and sanitization
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),

    // bcrypt the password
    asyncHandler(async (req,res,next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("sign-up");
        }
        const hashpw = await bcrypt.hash(req.body.password,10);
        const user = new User({
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            username:req.body.username,
            password: hashpw
        });
        await user.save();
        res.redirect("/");
    })
]);

// sign in page
router.get("/login", (req,res,next) => res.render("login"))

router.post("/login", passport.authenticate('local', {
    successRedirect:"/",
    failureRedirect:"/login",
    failureFlash:true
}))

// join club page
router.get("/join-club")
router.post("/join-club")

// create new message page
router.get("/new-message")
router.post("/new-message")

// delete message page
router.post("/delete-message/:id")


module.exports = router;