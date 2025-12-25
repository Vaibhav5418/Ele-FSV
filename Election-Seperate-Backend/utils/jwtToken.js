// Create Token and saving in cookie
const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
// Calculate the expiration date based on COOKIE_EXPIRE
// const cookieExpire = new Date(
//   Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
// );
const cookieExpire = new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000);

  // options for cookie
  const options = {
    expires: cookieExpire,
    httpOnly: true,
    secure: true, 
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
