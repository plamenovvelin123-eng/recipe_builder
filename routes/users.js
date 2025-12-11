const express = require('express')
const usersRouter = express.Router()
const User = require('../models/users')
const users = require('../models/users')
// const bcrypt = require("bcryptjs")


usersRouter.get('/', async(req, res) => {
    try{
        res.status(200).json(await User.find())
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
})
usersRouter.post('/register', async (req, res) => {
    const AVAILABLEDOMAINS = ["gmail.com", "abv.bg", "yahoo.com", "icloud.com"]
    try {
        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists and cannot be same" });
        }
        if (username == null || username.trim().length < 4) {
            return res.status(400).json({ message: "Username must be at least 4 characters long" });
        }
        if(!email.includes("@")){
            return res.status(400).json({message: "Please enter a valid Email Address!"})
        }
        const [glavnaChast, domain] = email.split("@")
        if(glavnaChast.length < 2  || glavnaChast.trim() === ""){
            return res.status(400).json({ message: "Too short Email username!"})
        }
        if(!AVAILABLEDOMAINS.includes(domain.toLowerCase())){
            return res.status(400).json({ message: "Not avaiable domain!"})
        }

        if (password == null || password.trim().length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ message: "Password must contain at least one number." });
        }
        
        
        const user = new User({
            username: username,
            password: password,
            email: email
        });
        const newUser = await user.save();
        res.status(201).json(newUser);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//LOGIN BATE
usersRouter.post('/login', async (req, res) => {
    const {username, password} = req.body;
    try {
        const user = await User.findOne({username: username})
        if(user == null){
            return  res.status(404).json({message: "Cannot find user"})
        }
        if(user.password !== password){
            return res.status(401).json({message: "Incorrect password"})
        }
        req.session.userId = user._id;
        req.session.username = user.username;
        res.status(200).json({message: "Login successful", userId: user._id})
    }catch(err){
        res.status(500).json({message: err.message})
    }
})

usersRouter.post('/logout', (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(400).json({ message: "No user is logged in" });
        }
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: "Logout failed" });
            }
            res.clearCookie('connect.sid');
            res.status(200).json({ message: "Logout successful" });
        });

    }catch(err) {
        res.status(500).json({ message: err.message });
    }
})

usersRouter.delete('/:id', getUserforUserRouter,  async(req, res) => {
    try{
        await res.user.deleteOne()
        res.json({message: "Deleted User"})
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
})

usersRouter.post("/update/username", async (req, res) => {
    const user = await users.findOne({ username: req.session.username });
    if (!user) {
        return res.status(400).json({ message: "Not found user" });
    }
    const newUsername = req.body.newUsername?.trim();
    if (!newUsername || newUsername.length < 4) {
        return res.status(400).json({ message: "Username cannot be less than 4 symbols or null." });
    }
    const alreadyExisting = await users.findOne({ username: newUsername });
    if (alreadyExisting) {  
        return res.status(400).json({ message: "Username already exists." });
    }
    user.username = newUsername;
    await user.save();
    req.session.username = newUsername;
    return res.status(200).json({ message: "Username changed!" });
});
//S BCRYPT NO NE RABOTI
// usersRouter.post("/update/password", async(req, res) =>{
//     const { currentPassword, newPassword } = req.body;
//     const user = await users.findOne({ username: req.session.username });
//     if (user === null) {
//         return res.status(400).json({ message: "User not found." });
//     }
//     const isSame = await bcrypt.compare(currentPassword, user.password);
//     if (!isSame) {
//         console.log(currentPassword);
//         console.log(newPassword);
        
//         return res.status(400).json({ message: "Your current password is not matching. Please try again" });
//     }
//     if (!newPassword || newPassword.trim().length < 6) {
//         return res.status(400).json({ message: "New password must be at least 6 characters long" });
//     }
//     if (!/[A-Z]/.test(newPassword)) {
//         return res.status(400).json({ message: "New password must contain at least one uppercase letter." });
//     }
//     if (!/[0-9]/.test(newPassword)) {
//         return res.status(400).json({ message: "New password must contain at least one number." });
//     }
//     const isSameNew = await bcrypt.compare(newPassword, user.password);
//     if (isSameNew) {
//         return res.status(400).json({ message: "New password cannot be the same as the old one." });
//     }
//     user.password = await bcrypt.hash(newPassword, 10);
//     await user.save();
//     return res.status(200).json({ message: "Password has been changed successfully" });
// });
usersRouter.post("/update/password", async(req, res)=>{
    const user = await users.findOne({ username: req.session.username });
    if(user === null){
        return res.status(400).json({message: "Not found user"})
    }
    try{
        const {currentPassword, newPassword} = req.body
        if(currentPassword !== user.password){
            return res.status(400).json({message: "Your current password is not matching. Please try again"})
        }
        if(newPassword === currentPassword){
            return res.status(400).json({message: "New password cannot be the same as the old one."})
        }
        if (!newPassword || newPassword.trim().length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long" });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ message: "New password must contain at least one uppercase letter." });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ message: "New password must contain at least one number." });
        }
        user.password = newPassword
        await user.save()
        return res.status(200).json({message: "Password has been changed successfully!"})
    }
    catch(err){
        return res.status(500).json({message: "Server Error"})
    }
})




async function getUserforUserRouter(req, res, next){
    let user
    try{
        user = await User.findById(req.params.id)
        if(user == null){
            return res.status(404).json({message: "Cannot find user"})
        }
    }
    catch(err){
        return res.status(500).json({message: err.message})
    }
    res.user = user
    next()
}









module.exports = usersRouter