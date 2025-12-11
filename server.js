require('dotenv').config()
const express = require('express')
const app = express()

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection

const session = require('express-session');
app.use(session({
  secret: "Moqtstringvkoitoneznamkakvodanapisha",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));
// KLIPCHETO
app.use(express.static("public"));


//MSG ZA BAZATA
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log("Connected to MongoDB")
});


app.set("view engine", "ejs")
app.use(express.json())


app.use(express.urlencoded({ extended: true }))
app.use('/images', express.static('images'));

app.get('/', (req, res) => {
    res.render("logintest")
})

app.listen(3000)


const userRouter = require("./routes/users")
app.use("/users", userRouter)

const recipeRouter = require("./routes/recipes")
app.use("/recipes", recipeRouter)

const apiRouter = require("./routes/api")
app.use("/api", apiRouter)

app.get("/logintest", (req, res) => {
    res.render("logintest");
});

app.get("/myrecipes/browse", (req, res) => {
    res.render("browse");
});

app.get("/home", (req, res) => {
    if (req.session.userId == null) {
        return res.redirect("/");
    }
    res.render("home", {
        username: req.session.username
    });
});

app.get("/myrecipes", (req, res) => {
    if (req.session.userId == null) {
        return res.redirect("/");
    }

    res.render("myrecipes", {
        username: req.session.username
    });
});
app.get("/favorites", (req, res) => {
    if (req.session.userId == null) {
        return res.redirect("/");
    }
    res.render("favorites", {
        username: req.session.username
    });
});
