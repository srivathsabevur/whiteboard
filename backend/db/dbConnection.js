const mongoose = require("mongoose");

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database is connected`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectToDB;
