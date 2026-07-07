module.exports = {
  MongoDBURL: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/VirtualFarmMarketDB",
  ServerPort: process.env.PORT || 3001,

  email: process.env.EMAIL_USER || "",
  password: process.env.EMAIL_PASSWORD || "",

  secret: process.env.JWT_SECRET || "VirtualFarmMarket", // jwt secret key
  jwtExpirationTime: 7 * 24 * 60 * 60,

  projectUrl: process.env.PROJECT_URL || "http://localhost:3001/",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
};
