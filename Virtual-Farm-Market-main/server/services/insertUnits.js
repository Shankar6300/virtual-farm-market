const mongoose = require("mongoose");
const config = require("../config/index");
const UnitModel = require("../db/models/Unit");

const units = [
  { name: "kg" },
  { name: "gram" },
  { name: "litre" },
  { name: "piece" },
  { name: "dozen" },
  { name: "bundle" },
];

const checkAndInsertUnits = async () => {
  try {
    await UnitModel.deleteMany({});
    await UnitModel.insertMany(units);
    console.log("CronJobForUnit: Data inserted successfully!");
  } catch (err) {
    console.error("Error seeding units:", err);
  }
};

mongoose.connect(config.MongoDBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

checkAndInsertUnits();

module.exports = UnitModel;
