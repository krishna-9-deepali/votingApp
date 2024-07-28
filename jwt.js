const jwt = require("jsonwebtoken");
const jwtAuthMiddleware = (req, res, next) => {
  console.log("middleware called");
  //first check request header has authorization or not
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: "Token Not Found" });
  }
  //Extract the jwt token from the request headers
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    //Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //return the payload used at the time of token creation.
    //Attach user information  to the request object
    req.user = decoded;
    console.log("Decoded :", decoded, "req :", req);
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Invalid token" });
  }
};
//Function to genrate JWT token
const generateToken = (userData) => {
  //Generate a new JWT Token using user data
  return jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: 300000,
  });
};
module.exports = { jwtAuthMiddleware, generateToken };
