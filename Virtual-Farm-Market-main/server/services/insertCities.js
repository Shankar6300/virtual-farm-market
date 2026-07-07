const mongoose = require("mongoose");
const cron = require("node-cron");
const config = require("../config/index");
const citiesName = require("./citiesName");

const citySchema = new mongoose.Schema({
  name: String,
  latitude: Number,
  longitude: Number,
});

const City = mongoose.model("cities", citySchema);

const mongoDBUrl = config.MongoDBURL;

const checkAndInsertData = async () => {
  try {
    await City.deleteMany({});
    await City.insertMany(citiesName);
    console.log("CronJobForCity: Data inserted successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
};

// Schedule the script to run every day at midnight
cron.schedule("0 0 * * *", () => {
  console.log("CronJobForCity: Running script to check and insert data...");
  checkAndInsertData();
});

mongoose.connect(mongoDBUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

checkAndInsertData();

module.exports = City;
