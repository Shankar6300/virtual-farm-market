const mongoose = require("mongoose");
const config = require("../config/index");
const CategoryModel = require("../db/models/Category");

const categories = [
  { name: "Vegetables" },
  { name: "Fruits" },
  { name: "Grains" },
  { name: "Dairy" },
  { name: "Pulses" },
  { name: "Spices" },
];

const checkAndInsertCategories = async () => {
  try {
    await CategoryModel.deleteMany({});
    await CategoryModel.insertMany(categories);
    console.log("CronJobForCategory: Data inserted successfully!");
  } catch (err) {
    console.error("Error seeding categories:", err);
  }
};

mongoose.connect(config.MongoDBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

checkAndInsertCategories();

module.exports = CategoryModel;
