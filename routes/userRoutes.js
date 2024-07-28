const express = require("express");
const router = express.Router();
const user = require("./../models/user");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");
router.post("/signup", async (req, res) => {
  try {
    const data = req.body;
    //Create a new user document using mngoose model
    const newUser = new user(data);
    //Finding the admin is already present or not.
    if (newUser.role === "admin") {
      const admin = await user.findOne({ role: "admin" });
      console.log(admin, ".....admin");
      if (admin) {
        return res.status(400).send("Admin already present.");
      }
    }
    // Check if there is already an admin user
    // const adminUser = await User.findOne({ role: 'admin' });
    // if (data.role === 'admin' && adminUser) {
    //     return res.status(400).json({ error: 'Admin user already exists' });
    // }

    // Validate Aadhar Card Number must have exactly 12 digit

    if (!/^\d{12}$/.test(data.adharCardNumber)) {
      return res
        .status(400)
        .json({ error: "Aadhar Card Number must be exactly 12 digits" });
    }

    // Check if a user with the same Aadhar Card Number already exists
    const existingUser = await user.findOne({
      adharCardNumber: data.adharCardNumber,
    });
    if (existingUser) {
      return res.status(400).json({
        error: "User with the same Aadhar Card Number already exists",
      });
    }
    //save the new user in database
    const savedUser = await newUser.save();
    const payload = {
      id: savedUser.id,
    };
    console.log(JSON.stringify(payload));
    const token = generateToken(payload); //param is payload we add payload anything eg savedUser.email or savedUser.username
    console.log("Token generate :", token);
    res.status(201).send({ savedUser: savedUser, token: token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "Internal Server Error " });
  }
});
//Login Route
router.post("/login", async (req, res) => {
  try {
    //Extract username and password from request body
    const { adharCardNumber, password } = req.body;
    //Find the user by  username
    const currenttuser = await user.findOne({
      adharCardNumber: adharCardNumber,
    });
    console.log("user:===", user, currenttuser);
    //If user does not exist or password does not match,return error
    if (!currenttuser || !(await currenttuser.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    //generate token
    const payload = { id: currenttuser.id };
    const token = generateToken(payload);
    //return token as response
    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});

//Profile route
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user; //req.user get by jwt.verify() is payload

    const userId = userData.id;
    const user = await user.findById(userId);
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});

//Update
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; //Extract the  id from the token
    const { currentPassword, newPassword } = req.body; //Extract current and new password from req body
    // Check if currentPassword and newPassword are present in the request body
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both currentPassword and newPassword are required" });
    }
    //Find the user by userId
    const user = await user.findById(userId);
    //If password does not match,return error
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Invalid current password" });
    }
    //update user password
    user.password = newPassword;
    await user.save();
    console.log("Password updated");
    res.status(200).send({ message: "Password Upadated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: "Internal Server Error " });
  }
});

module.exports = router;
