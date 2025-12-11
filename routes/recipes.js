const express = require('express')
const recipeRouter = express.Router()
const Recipe = require('../models/recipes')
const User = require('../models/users');



const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });


recipeRouter.get('/myrecipes', async(req, res) => {
    try{
        res.render('myrecipes', {
            recipes: await Recipe.find({owner: req.session.userId}), 
            username: req.session.username
    })
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
})
// ZA TEST
// recipeRouter.get('/myrecipes/ingredients', async (req, res) => {
//     try{
//         const recipes = await Recipe.find({owner: req.session.userId});
//         res.render('ingredients', {
//             recipes: recipes,
//             username: req.session.username
//         });
//     }catch(err){
//         res.status(500).json({message: err.message})
//     }
// })
recipeRouter.get('/', async(req, res) => {
    try{
        const recipes = await Recipe.find()
        res.status(200).json(recipes)
    }
    catch(err){
        res.status(500).json({message: err.message})
    }
})
// ZA V1
// recipeRouter.get('/cards', async(req, res) => {
//     try{
//         const recipes = await Recipe.find({ owner: req.session.userId })
//         res.render('recipescards', {recipes: recipes} )
//     }
//     catch(err){
//         res.status(500).json({message: err.message})
//     }
// })

recipeRouter.get("/myrecipes/browse", (req, res) => {
    res.render("browse", { username: req.session.username });
});


recipeRouter.post('', upload.single("img"), async (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" });
    }
    try {
        const recipe = new Recipe({
            Dish: req.body.Dish,
            Ingredients: req.body.Ingredients,
            Instructions: req.body.Instructions,
            owner: req.session.userId,
            img: req.file ? '/images/' + req.file.filename : null,
            Description: req.body.Description
        });

        const newRecipe = await recipe.save();
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.recipes.push(newRecipe._id);
        await user.save();
        return res.redirect('/recipes/myrecipes');
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


recipeRouter.get('/:id', getRecipe,(req, res) => {
    res.status(200).json(res.recipe)
})

recipeRouter.patch('/:id', getRecipe, async (req, res) => {
    if (req.body.Dish !== undefined) {
        res.recipe.Dish = req.body.Dish;
    }
    if (req.body.Instructions !== undefined) {
        res.recipe.Instructions = req.body.Instructions;
    }
    if (req.body.Ingredients !== undefined) {
        res.recipe.Ingredients = req.body.Ingredients;
    }
    if (req.body.Description !== undefined) {
        res.recipe.Description = req.body.Description;
    }
    try {
        const updatedRecipe = await res.recipe.save();
        res.status(200).json(updatedRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


recipeRouter.delete('/:id', getRecipe, async (req, res) => {
    try {
        const recipe = res.recipe;
        await User.updateOne(
            { _id: recipe.owner },
            { $pull: { recipes: recipe._id } }
        );
        await Recipe.deleteOne({ _id: recipe._id });

        res.status(200).json({ message: "Recipe deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getRecipe(req, res, next) {
    let recipe
    try{
        recipe = await Recipe.findById(req.params.id)
        if(recipe == null){
            return res.status(404).json({message: "Cannot find recipe"})
        }
    }catch(err){
        return res.status(500).json({message: err.message})
    }
    res.recipe = recipe
    next()
}
// TEST ZA MIDDLEWARE NA USER
// async function edituserpermission(req, res, next) {
//     const userId = req.session.userId
//     if(userId == null){
//         return res.status(401).json({error: "Not Authorized"})
//     }
//     try{
//     const user = await users.findById(userId)
//     if(!user.recipes.includes(req.params.id)){
//         return res.status(403).json({err: "Forbidden"})
//     }
//     }catch(error){
//         return res.status(500).json({error: "Server error"})
//     }
//     next()
// }

recipeRouter.get('/forward/:code', (req, res) =>{
    const code = req.body.params
    res.redirect(`https://world.openfoodfacts.org/product/${code}`);
});
module.exports = recipeRouter
