const express = require("express");
const { body, validationResult } = require("express-validator")
const passport = require("passport");
const asyncHandler = require('express-async-handler');
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

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
    res.render("layout", {
        title:"Sign Up",
        errors:null
    });
});

router.post("/sign-up",[
    // body verification and sanitization
    // bcrypt the password
    asyncHandler(async (req,res,next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("layout", {
                title:"Sign Up",
                errors:errors.array()
            })
        }
        const {firstname,lastname,username,password} = req.body;
        const hashpw = await bcrypt.hash(password,10);
        const user = new User({
            firstName:firstname,
            lastName:lastname,
            username:username,
            password: hashpw
        });
        await user.save();
        res.redirect("/");
    })
]);

// sign in page
router.get("/login", (req,res,next) => res.render("layout", {
    title:"Sign In"
}))

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