require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const indexRouter = require('./routes/index');
const User = require('./models/User');
const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error",console.error.bind(console,"mongo connection error"));

const app = express();
// Set the views directory
app.set("views", path.join(__dirname, "views"));
// Set EJS as the view engine
app.set("view engine", "ejs");

app.use(session({ secret: process.env.SECRET_KEY, resave: false, saveUninitialized: true }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({username:username}).exec();
            if (!user) {
                return done(null,false, {message: "Incorrect username"});
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

app.get("/", (req, res) => res.render("index"));

app.listen(3000, () => console.log("app listening on port 3000!"));
