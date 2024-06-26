const express = require("express");
const { body, validationResult } = require("express-validator")
const passport = require("passport");
const asyncHandler = require('express-async-handler');
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");

const router = express.Router();

// home page
router.get("/", asyncHandler(async (req,res,next) => {
    const allChats = await Chat.find({}).exec();
    res.render("layout", {
        title:"Home",
        user:req.user,
        chats:allChats,
        chat:null,
        isMember:null,
        messages:null,
        messageErrors:null
    });
}));
// sign up page
router.get("/sign-up", (req,res,next) => {
    res.render("sign-up",{errors:null});
});

router.post("/sign-up",[
    // body verification and sanitization
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    body("admin").escape(),

    // bcrypt the password
    asyncHandler(async (req,res,next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("sign-up",{errors:errors.array()});
        }
        const hashpw = await bcrypt.hash(req.body.password,10);
        var isAdmin = false;
        if (req.body.admin) isAdmin = true;
        const user = new User({
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            username:req.body.username,
            password: hashpw,
            admin:isAdmin
        });
        await user.save();
        res.redirect("/");
    })
]);

// sign in page
router.get("/login", (req,res,next) => res.render("login", {
    error: req.flash('error')
}))

router.post("/login", passport.authenticate('local', {
    successRedirect:"/",
    failureRedirect:"/login",
    failureFlash:true
}))

// log out
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

// render chat page
router.get("/chat/:id", asyncHandler(async (req,res,next) => {
    const [chat,allChats,messages] = await Promise.all([
        Chat.findById(req.params.id).exec(),
        Chat.find({}).exec(),
        Message.find({chat:req.params.id}).populate("author").sort({timestamp:1}).exec()
    ]);
    const isMember = chat && chat.members.includes(req.user._id)
    res.render("layout", {
        title:"Chat",
        user:req.user,
        chats:allChats,
        chat:chat,
        isMember:isMember,
        messages:messages,
        messageErrors:null,
        passwordErrors:null
    });
}));

// create new message/join chat/deletion
router.post("/chat/:id", [
    // General validation for formType
    body("formType").notEmpty().withMessage("Form type is required"),
    // Conditional validation for message form
    body("title").if(body("formType").equals("messageForm")).notEmpty().withMessage("Title is required").trim().escape(),
    body("message").if(body("formType").equals("messageForm")).notEmpty().withMessage("Message is required").trim().escape(),
    // Conditional validation for password form
    body("password").if(body("formType").equals("passwordForm")).notEmpty().withMessage("Password is required").custom(async (value, { req }) => {
            const chat = await Chat.findById(req.params.id);
            if (!chat) {
                throw new Error('Chat not found');
            }
            if (value !== chat.password) {
                throw new Error('Incorrect password');
            }
            return true;
        }).withMessage("Incorrect password"),
    // verify errors
    asyncHandler(async (req,res,next) => {
        const [chat,allChats,messages] = await Promise.all([
            Chat.findById(req.params.id).exec(),
            Chat.find({}).exec(),
            Message.find({chat:req.params.id}).populate("author").sort({timestamp:1}).exec()
        ]);
        const isMember = chat && chat.members.includes(req.user._id)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const passwordErrors = errors.array().filter(error => error.path === 'password');
            const messageOrTitleErrors = errors.array().filter(error => error.path === 'message' || error.path === 'title');
            res.render("layout", {
                title:"Chat",
                user:req.user,
                chats:allChats,
                chat:chat,
                isMember:isMember,
                messages:messages,
                messageErrors:messageOrTitleErrors,
                passwordErrors:passwordErrors[0]
            });
            return;
        }
        const formType = req.body.formType;
        if (formType == 'messageForm') {
            const message = new Message({
                title:req.body.title,
                text:req.body.message,
                author:req.user,
                chat:chat,
                timeStamp: Date.now
            });
            await message.save()
            res.redirect(`/chat/${chat._id}`);
            return;
        } else if (formType == 'passwordForm') {
            const password = req.body.password;
            if (password == chat.password) {
                // set isMember true
                chat.members.push(req.user._id);
                await chat.save();
                res.redirect(`/chat/${chat._id}`);
                return;
            }
        } else if (formType == "deleteForm") {
            const message = await Message.findByIdAndDelete(req.body.deleteMessage);
            res.redirect(`/chat/${req.params.id}`);
            return;
        }
    })
]);

// new chat page
router.get("/new-chat",(req,res,next) => {
    res.render("new-chat",{errors:null});
});
router.post("/new-chat", [
    body("groupName").notEmpty().withMessage("Group name is required").trim().escape(),
    body("password").notEmpty().withMessage("Password is required").trim().escape(),
    asyncHandler(async (req,res,next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("new-chat",{errors:errors.array()});
        }
        const chat = new Chat({
            name:req.body.groupName,
            password:req.body.password,
            members:[req.user._id]
        })
        await chat.save();
        res.redirect(`/chat/${chat._id}`);
    })
]);

module.exports = router;