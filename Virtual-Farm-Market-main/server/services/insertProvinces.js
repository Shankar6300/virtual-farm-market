const mongoose = require("mongoose");
const cron = require("node-cron");
const config = require("../config/index");
const provincesName = require("./provincesNames");

const provincesSchema = new mongoose.Schema({
  name: String,
});

const Provinces = mongoose.model("provinces", provincesSchema);

const mongoDBUrl = config.MongoDBURL;

const checkAndInsertData = async () => {
  try {
    await Provinces.deleteMany({});
    const provincesData = provincesName.map((name) => ({ name }));
    await Provinces.insertMany(provincesData);
    console.log("CronJobForProvince: Data inserted successfully!");
  } catch (err) {
    console.error("Error:", err);
  }
};

// Schedule the script to run every day at midnight
cron.schedule("0 0 * * *", () => {
  console.log("CronJobForProvince: Running script to check and insert data...");
  checkAndInsertData();
});

mongoose.connect(mongoDBUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

checkAndInsertData();

module.exports = Provinces;
