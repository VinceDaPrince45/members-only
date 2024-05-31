require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require("path");
const MongoStore = require('connect-mongo');

const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const flash = require('connect-flash');
const bcrypt = require("bcryptjs");
const compression = require("compression");

const User = require('./models/User');
const indexRouter = require("./routes/index");

mongoose.set("strictQuery", false);
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}

const app = express();

app.use(compression()); // Compress all routes
app.use(express.static(path.join(__dirname, 'public')));
// Set the views directory
app.set("views", path.join(__dirname, "views"));
// Set EJS as the view engine
app.set("view engine", "ejs");

const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
});
// Apply rate limiter to all requests
app.use(limiter);
app.use(session({ 
    secret: process.env.SECRET_KEY, 
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    resave: false, 
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
 }));
app.use(passport.session());
app.use(flash());
app.use(express.urlencoded({ extended: false }));
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({username:username}).exec();
            if (!user) {
                return done(null,false, {message: "Username not found"});
            }
            const isMatch = await bcrypt.compare(password,user.password);
            if (!isMatch) {
                return done(null,false, {message: "Incorrect password."});
            }
            return done(null,user);
        } catch (err) {
            return done(err);
        }
    }
));
passport.serializeUser((user,done) => {
    done(null,user.id);
});
passport.deserializeUser(async (id,done) => {
    try {
        const user = await User.findById(id);
        done(null,user);
    } catch (err) {
        done(err)
    }
});

app.use("/", indexRouter);

app.listen(3000, () => console.log("app listening on port 3000!"));
