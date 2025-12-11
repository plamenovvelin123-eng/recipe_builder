const mongoose = require('mongoose');
const Recipe = require('./recipes');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true},
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    favorites: []
});

module.exports = mongoose.model('User', userSchema);
