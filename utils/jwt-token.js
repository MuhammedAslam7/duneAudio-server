import jwt from "jsonwebtoken";

//create refresh token
export const createRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "1d",
    }
  );
};

//create access token
export const createAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10s",
    }
  );
};
