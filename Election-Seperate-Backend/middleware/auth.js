const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const electionUser = require("../models/election-user");


const authorizeRolesElection = (...allowedRoles) => {
  return async (req, res, next) => {
    const { mobile } = req.query;
    try {

      console.log("userr", mobile);
      const user = await electionUser.findOne({ mobile: parseInt(mobile) });

      if (!user) {
        throw new ErrorHander('User not found', 404);
      }

      // Check if the user's role is allowed for the route
      console.log("user role", user.role);
      if (!allowedRoles.includes(user.role)) {
        throw new ErrorHander(`Role: ${user.role} is not allowed to access this resource`, 403);
      }

      // Attach the user to the request object for further use if needed
      req.user = user;

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      next(error); // Pass any errors to the global error handler
    }
  };
};
exports.authorizeRolesElection = authorizeRolesElection;
