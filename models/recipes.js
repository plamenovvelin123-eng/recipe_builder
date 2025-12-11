const mongoose = require('mongoose')

const recipeSchema = new mongoose.Schema({
    Dish:{
        type: String,
        required: true
    },
    Ingredients: {
        type: String,
        required: true
    },
    Instructions: {
        type: String,
        required: true
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true 
    },
    img: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: false
    }


})


module.exports = mongoose.model('Recipe', recipeSchema)