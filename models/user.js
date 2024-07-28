const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
//Define person schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
  },
  mobile: { type: String },
  address: {
    type: String,
    required: true,
  },
  adharCardNumber: { type: Number, required: true, unique: true },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["voter", "admin"],
    default: "voter",
  },
  isVoted: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  const user = this; //this represent here each document (registration data)
  //Hash the password only of it has been modified (or is new)
  if (!user.isModified("password")) return next();
  try {
    //hash password generation
    const salt = await bcrypt.genSalt(10);
    //Hash password
    const hashedPassword = await bcrypt.hash(user.password, salt);
    //Override the plain password with the hashed one
    user.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

//Define comparePassword()
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    //use bcrypt to compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
};
const user = mongoose.model("user", userSchema);
module.exports = user;
