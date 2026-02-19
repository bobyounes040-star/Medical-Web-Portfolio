const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization; // getting the header from the client which is "Bearer <token>"
    if (!header || !header.startsWith("Bearer ")) { // if the header is empty or null or doesn't start with Bearer then it is invalid
      return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = header.split(" ")[1]; // Here we splitting the authorization which is "Bearer <token>" into an arraylist(["bearer",token]) and getting only the token which is [1]
    const payload = jwt.verify(token, process.env.JWT_SECRET); // verification of the provided token with the token build in inside the env file and then getting all the info of the token

   
    req.user = payload; // implies now user has { userId, role, email }
    next();// meaning we are finished here and achieved our purpose move to the next route
  } 
  catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

