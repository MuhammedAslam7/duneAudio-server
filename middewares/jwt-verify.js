import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req?.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ message: "Token is required for authorization" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid access token" });
    } else {
      req.user = decoded;
      next();
    }
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export const verifyRole = (roles) => (req, res, next) => {
  try {
    if (!roles.includes(req?.user?.role)) {
      return res.status(403).json({ message: "Request access denied" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
