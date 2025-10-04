const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb+srv://mahekg696:Mahek696@cluster0.o04za.mongodb.net/expense-tracker?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const User = require("./models/User");

async function makeAdmin() {
  try {
    // Find user by email and update to admin
    const email = "moon9696@mail.com"; // Use existing user

    const user = await User.findOneAndUpdate(
      { email: email },
      { role: "admin" },
      { new: true }
    );

    if (user) {
      console.log(`✅ User ${user.email} is now an admin!`);
      console.log("User details:", {
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      console.log("❌ User not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

makeAdmin();
