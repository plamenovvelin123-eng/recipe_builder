const express = require("express");
const apiRouter = express.Router();
const axios = require("axios");
const users = require("../models/users");
const Recipe = require("../models/recipes")
//ZA TEST
apiRouter.get("/test_products", async (req, res) => {
    try {
        const url = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=food&search_simple=1&action=process&json=1";
        const response = await axios.get(url);

        const clean = response.data.products.filter(p =>
            p.product_name &&
            (p.image_front_small_url || p.image_url)
        );

        const tenProducts = clean.slice(0, 10).map(p => ({
            name: p.product_name,
            image: p.image_front_small_url || p.image_url,
            code: p.code,
            kcal: p.nutriments?.["energy-kcal_100g"] || null,
            proteins: p.nutriments?.["proteins_100g"] || null,
            fat: p.nutriments?.["fat_100g"] || null,
            sugar: p.nutriments?.["sugars_100g"] || null
        }));

        res.json(tenProducts);

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});


//SEARCHA BARA NA INGREDIENTS
apiRouter.get("/browse/:keyword", async (req, res) => {
    const keyword = req.params.keyword.trim();

    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${keyword}&search_simple=1&action=process&json=1&page_size=50`;

        const response = await axios.get(url);

        const clean = response.data.products.filter(
            p => p.product_name && (p.image_front_small_url || p.image_url)
        );

        const formatted = clean.map(p => ({
            name: p.product_name,
            image: p.image_front_small_url || p.image_url,
            brand: p.brands || null,
            code: p.code,
            nutriscore: p.nutriscore_grade || null,
            nova: p.nova_group || null,
            ecoscore: p.ecoscore_grade || null
        }));

        res.json(formatted);

    } catch (err) {
        console.error("BROWSE ERROR:", err);
        res.status(500).json({ message: "Error fetching products" });
    }
});


// ZA OPEN FOODS
apiRouter.get("/forward/:code", (req, res) => {
    const code = req.params.code;
    if (code == null) return res.status(400).send("Missing product code.");

    const openfoodfactsurl = `https://world.openfoodfacts.org/product/${code}`;
    return res.redirect(openfoodfactsurl);
});
// ZA THE MEALDB
apiRouter.get("/", async (req, res) => {
    try {
        const meals = [];

        for (let i = 0; i < 15; i++) {
            const response = await axios.get("https://www.themealdb.com/api/json/v1/1/random.php");
            meals.push(response.data.meals[0]);
        }
        res.json(meals);
    } catch (error) {
        console.error("Error loading random meals:", error);
        res.status(500).json({ error: "Failed to load meals" });
    }
});



// FAVOURITES
apiRouter.post('/favorites/:mealId', async (req, res) =>{
    const userId = req.session.userId
    if (userId == null){
        return res.status(401).json({error: "Not Authorized"})
    }
    try{
    const user = await users.findById(userId)
    const mealId = req.params.mealId
    user.favorites.push(mealId)
    await user.save()
    res.status(200).json("Added")
    }
    catch(err){
        res.status(500).json("Server error")
    }

})

apiRouter.delete('/favorites/:mealId', async(req, res) =>{
    const userId = req.session.userId
    if(userId == null){
        return res.status(401).json({error: "Not Authorized"})
    }
    try{
    const mealId = req.params.mealId
    const user = await users.findById(userId)
    if(user.favorites.includes(mealId)){
        user.favorites = user.favorites.filter(id => id !== mealId);
        await user.save();
        return res.status(200).json("Deleted")
    }   
    }
    catch(err){
        res.status(500).json("Server error")
    }
})

apiRouter.get('/favorites/list', async (req, res) => {
    const userId = req.session.userId;
    if (userId == null) {
        return res.status(401).json({ error: "Not Authorized" });
    }

    try {
        const user = await users.findById(userId);
        return res.status(200).json(user.favorites);
    }
    catch (err) {
        return res.status(500).json({ error: "Server error" });
    }
});


apiRouter.get("/favorites/:mealId", async(req, res) => {
    const userId = req.session.userId
    if(userId == null){
        return res.status(401).json( {error: "Not Authorized"})
    }
   
    try{
        const user = await users.findById(userId)
        const mealId = req.params.mealId
         if(!user.favorites.includes(mealId)){
            return res.status(404).json({error: "Not in favorites"})
         }
        
        const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
        const response = await axios.get(url)
        return res.json(response.data.meals[0])

    }catch(err){
        return res.status(500).json({ error: "Server error" });
    }

})

apiRouter.get('/favorites/shopping/:mealId', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Not Authorized" });
    }

    const mealId = req.params.mealId;

    try {
        const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`;
        const response = await axios.get(url);
        const meal = response.data.meals[0];

        const ingredients = [];

        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];

            if (ingredient && ingredient.trim() !== "") {
                ingredients.push({
                    ingredient: ingredient.trim(),
                    measure: measure ? measure.trim() : ""
                });
            }
        }
       return res.render("shopping", {
            mealName: meal.strMeal,
            ingredients: ingredients,
            username: req.session.username
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
});

apiRouter.get("/recipes", async(req, res)=>{
    try{
        const response = await Recipe.find()
        res.status(200).json(response)
    }catch(err){
        res.status(500).json({message: "Server Error"})
    }
})

// ZA DA RABOTI, TRQBVA V SCHEMATA DA SETNEM OWNER-A
apiRouter.post("/recipes", async (req, res) => {
    try {
        const { Dish, Ingredients, Instructions, img, Description } = req.body;

        const recipe = await Recipe.create({
            Dish,
            Ingredients,
            Instructions,
            img,
            Description,
            owner: null
        });

        return res.status(201).json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

apiRouter.get("/ingredients/search", async(req, res)=>{
    const q = req.query.q
    if(q === null){
        return res.status(400).json({message: "Missing query."})
    }
    try{
        const response = await Recipe.find({Ingredients: { $regex: q, $options: "i" } })
        if(response.length > 0){
            return res.status(200).json(response)
        }else{
            return res.status(400).json({message: "Not Found Recipes by your query."})
        }
    }catch(err){
        return res.status(500).json({message: "Server error"})
    }
})

apiRouter.get("/my/ingredients/search", async (req, res) => {
    const q = req.query.q;
    if (!q) {
        return res.status(400).json({ message: "Missing query." });
    }
    try {
        const response = await Recipe.find({
            owner: req.session.userId,
            Ingredients: { $regex: q, $options: "i" }
        });
        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});


apiRouter.get("/lists/from-recipe/:id", async (req, res) =>{
    const id = req.params.id
    try{
        const recipe = await Recipe.findById(id)
        if(!recipe){
            return res.status(404).json({message: "Not recipe found"})
        }
        const list = recipe.Ingredients
                    .split(", ")
                    .map(i => i.trim())
                    .filter(i => i.length > 0);

        return res.status(200).json(list)

    }catch(err){
        return res.status(500).json({message: "Server Error"})
    }
})



module.exports = apiRouter;
