const mongoose = require("mongoose");
const config = require("../config/index");
const ProductModel = require("../db/models/Product");
const UserModel = require("../db/models/User");
const bcrypt = require("bcryptjs");

const checkAndInsertProducts = async () => {
  try {
    // Clear existing products to ensure clean seed
    await ProductModel.deleteMany({});

    // Localize all existing users to India
    await UserModel.updateMany({}, { city: "Hyderabad", province: "Telangana" });

    // Retrieve the first user from DB to find the active test location
    let refUser = await UserModel.findOne({});
    let city = "Hyderabad";
    let province = "Telangana";
    if (refUser) {
      city = refUser.city;
      province = refUser.province;
    }

    // Hash the standard test password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Test1234!", salt);

    // List of farmers to seed/verify
    const farmersInfo = [
      { name: "shankar", email: "goddetishankar196@gmail.com", phoneNumber: "8989898989" },
      { name: "John's Family Farm", email: "farmer_john@vfm.com", phoneNumber: "9876543211" },
      { name: "Clara's Green Acres", email: "farmer_clara@vfm.com", phoneNumber: "9876543212" },
      { name: "Bob's Organic Valley", email: "farmer_bob@vfm.com", phoneNumber: "9876543213" },
    ];

    const farmers = [];
    for (const farmerData of farmersInfo) {
      let farmer = await UserModel.findOne({ email: farmerData.email });
      if (!farmer) {
        farmer = await UserModel.create({
          name: farmerData.name,
          email: farmerData.email,
          password: hashedPassword,
          phoneNumber: farmerData.phoneNumber,
          city: city,
          province: province,
          userType: "Farmer",
          isEmailConfirmed: true,
        });
        console.log(`Created farmer: ${farmerData.name} (${farmerData.email})`);
      } else {
        // Ensure farmer is mapped to current active location and has password Test1234!
        farmer.city = city;
        farmer.province = province;
        farmer.password = hashedPassword;
        await farmer.save();
        console.log(`Verified/updated farmer: ${farmer.name}`);
      }
      farmers.push(farmer);
    }

    const categoriesData = {
      "Vegetables": [
        "Tomato", "Onion", "Potato", "Spinach", "Carrot", "Cucumber", "Brinjal", 
        "Ladies Finger", "Cauliflower", "Cabbage", "Green Peas", "Mint Leaves", 
        "Coriander Leaves", "Garlic", "Ginger", "Green Chili", "Capsicum", "Beetroot", 
        "Radish", "Sweet Potato"
      ],
      "Fruits": [
        "Mango", "Banana", "Apple", "Orange", "Grape", "Papaya", "Pomegranate", 
        "Guava", "Watermelon", "Pineapple", "Coconut", "Lemon", "Strawberry", "Kiwi", 
        "Pear", "Plum", "Peach", "Apricot", "Fig", "Dates"
      ],
      "Grains": [
        "Basmati Rice", "Sona Masoori Rice", "Wheat Flour", "Oats", "Barley", "Millet", 
        "Maize", "Quinoa", "Rye", "Brown Rice", "Jasmine Rice", "Wild Rice", "Sorghum", 
        "Spelt", "Buckwheat", "Amaranth", "Semolina", "Broken Wheat", "Cornmeal", "Rice Flour"
      ],
      "Dairy": [
        "Fresh Milk", "Paneer", "Curd", "Butter", "Ghee", "Cheese Block", "Butter Milk", 
        "Fresh Cream", "Greek Yogurt", "Mozzarella Cheese", "Cheddar Cheese", "Cottage Cheese", 
        "Condensed Milk", "Milk Powder", "Whey Protein", "Margarine", "Tofu", "Goat Milk", 
        "Sour Cream", "Whipping Cream"
      ],
      "Pulses": [
        "Toor Dal", "Chana Dal", "Moong Dal", "Masoor Dal", "Urad Dal", "Rajma (Kidney Beans)", 
        "Kabuli Chana", "Black Eyed Peas", "Green Gram", "Horse Gram", "Soybeans", "Yellow Peas", 
        "Chickpeas", "Red Lentils", "Green Lentils", "Black Lentils", "Split Peas", "Lima Beans", 
        "Fava Beans", "Pinto Beans"
      ],
      "Spices": [
        "Turmeric Powder", "Red Chili Powder", "Coriander Powder", "Cumin Seeds", "Mustard Seeds", 
        "Cardamom Pods", "Cloves", "Cinnamon Sticks", "Black Pepper", "Fenugreek Seeds", 
        "Fennel Seeds", "Asafoetida", "Garam Masala", "Bay Leaves", "Star Anise", "Nutmeg", 
        "Mace", "Carom Seeds", "Ginger Powder", "Garlic Powder"
      ]
    };

    const categoryImages = {
      "Vegetables": "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=60",
      "Fruits": "https://images.unsplash.com/photo-1610832958506-ee5633613df2?w=500&auto=format&fit=crop&q=60",
      "Grains": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
      "Dairy": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop&q=60",
      "Pulses": "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=500&auto=format&fit=crop&q=60",
      "Spices": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60"
    };

    const productSpecificImages = {
      // Vegetables
      "tomato": "https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop&q=60",
      "onion": "https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&auto=format&fit=crop&q=60",
      "potato": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60",
      "spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=60",
      "carrot": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=60",
      "cucumber": "https://images.unsplash.com/photo-1604974244762-26379363725f?w=500&auto=format&fit=crop&q=60",
      "brinjal": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60",
      "ladies finger": "https://images.unsplash.com/photo-1627916607164-7b20241db935?w=500&auto=format&fit=crop&q=60",
      "cauliflower": "https://images.unsplash.com/photo-1568584711271-6c8a14092b13?w=500&auto=format&fit=crop&q=60",
      "cabbage": "https://images.unsplash.com/photo-1550159930-40066082a4fc?w=500&auto=format&fit=crop&q=60",
      "green peas": "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=500&auto=format&fit=crop&q=60",
      "garlic": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&auto=format&fit=crop&q=60",
      "ginger": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=60",
      "green chili": "https://images.unsplash.com/photo-1564757303038-f99090fb4ab1?w=500&auto=format&fit=crop&q=60",
      "capsicum": "https://images.unsplash.com/photo-1563565313028-ac7a2c7cf542?w=500&auto=format&fit=crop&q=60",
      "beetroot": "https://images.unsplash.com/photo-1585728748176-455ac5eed962?w=500&auto=format&fit=crop&q=60",
      "radish": "https://images.unsplash.com/photo-1593105541416-86c4786d790d?w=500&auto=format&fit=crop&q=60",
      "sweet potato": "https://images.unsplash.com/photo-1596097480979-a202c6d4db50?w=500&auto=format&fit=crop&q=60",

      // Fruits
      "mango": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=60",
      "banana": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60",
      "apple": "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60",
      "orange": "https://images.unsplash.com/photo-1547514701-42782101795e?w=500&auto=format&fit=crop&q=60",
      "grape": "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=60",
      "papaya": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=500&auto=format&fit=crop&q=60",
      "pomegranate": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60",
      "guava": "https://images.unsplash.com/photo-1534444589932-a5ec08b4931a?w=500&auto=format&fit=crop&q=60",
      "watermelon": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60",
      "pineapple": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=60",
      "coconut": "https://images.unsplash.com/photo-1525203135335-74d272fc8d9c?w=500&auto=format&fit=crop&q=60",
      "lemon": "https://images.unsplash.com/photo-1590502593747-42a996133562?w=500&auto=format&fit=crop&q=60",
      "strawberry": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=60",
      "kiwi": "https://images.unsplash.com/photo-1585052201332-b8c0ce30972f?w=500&auto=format&fit=crop&q=60",
      "pear": "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=500&auto=format&fit=crop&q=60",
      "peach": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=60",
      "apricot": "https://images.unsplash.com/photo-1568584711271-6c8a14092b13?w=500&auto=format&fit=crop&q=60",
      "fig": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=500&auto=format&fit=crop&q=60",
      "dates": "https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop&q=60",

      // Grains
      "basmati rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
      "sona masoori rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
      "wheat flour": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500&auto=format&fit=crop&q=60",
      "oats": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=60",
      "barley": "https://images.unsplash.com/photo-1534080391025-a87d009315d0?w=500&auto=format&fit=crop&q=60",
      "maize": "https://images.unsplash.com/photo-1551754655-cd27e38d20f6?w=500&auto=format&fit=crop&q=60",
      "quinoa": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",

      // Dairy
      "fresh milk": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60",
      "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60",
      "curd": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60",
      "butter": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=60",
      "ghee": "https://images.unsplash.com/photo-1622484211148-716260840f9e?w=500&auto=format&fit=crop&q=60",
      "cheese block": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500&auto=format&fit=crop&q=60",
      "greek yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=60",

      // Pulses
      "toor dal": "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=500&auto=format&fit=crop&q=60",
      "chana dal": "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=500&auto=format&fit=crop&q=60",
      "moong dal": "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=500&auto=format&fit=crop&q=60",
      "rajma (kidney beans)": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=500&auto=format&fit=crop&q=60",
      "chickpeas": "https://images.unsplash.com/photo-1545114197-2d888812f207?w=500&auto=format&fit=crop&q=60",

      // Spices
      "turmeric powder": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60",
      "red chili powder": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60",
      "coriander powder": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60",
      "cumin seeds": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60",
      "mustard seeds": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60",
    };

    const productsToInsert = [];
    let productIndex = 0;
    for (const [category, products] of Object.entries(categoriesData)) {
      products.forEach((name) => {
        const currentFarmer = farmers[productIndex % farmers.length];
        const imgUrl = productSpecificImages[name.toLowerCase()] || categoryImages[category] || "";
        productsToInsert.push({
          name: name,
          description: `Fresh, organic, premium quality ${name.toLowerCase()} sourced directly from local organic farms. Ready for pickup.`,
          category: category,
          price: Math.floor(Math.random() * 80) + 20, // Random price between 20 and 100
          unit: category === "Dairy" && name.includes("Milk") ? "litre" : "kg",
          quantityAvailable: Math.floor(Math.random() * 50) + 15,
          seller: currentFarmer._id,
          city: city,
          province: province,
          images: [imgUrl]
        });
        productIndex++;
      });
    }

    await ProductModel.insertMany(productsToInsert);
    console.log("CronJobForProducts: 120 products successfully seeded!");
  } catch (err) {
    console.error("Error seeding products:", err);
  }
};

mongoose.connect(config.MongoDBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

checkAndInsertProducts();

module.exports = ProductModel;
