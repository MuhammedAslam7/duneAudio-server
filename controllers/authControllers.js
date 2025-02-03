import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/userModel.js";
import TempUser from "../model/tempUserModel.js";
import Otp from "../model/otp.js";
import { generateOTP, sendOTPEmail } from "../utils/otp.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt-token.js";
import { Wallet } from "../model/walletSchema.js";

export const signup = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    //
    const existTemp = await TempUser.findOne({ email });
    if (existTemp) {
      return res.status(409).json({ message: "Retry after 2 minute" });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(401).json({ message: "User already Exist" });
    }
    //otp generation
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 60000); // expire in 1 minut

    const hashedPassword = await bcryptjs.hash(password, 10);

    await TempUser.create({
      username,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpires,
    });
    //sending otp
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP Send to Email" });
  } catch (error) {
    res.status(500).json({ message: "Error in Signup", error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otpValue } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(400).json({ message: "Invalid Email" });
    }
    if (tempUser.otp != otpValue) {
      console.log("otp error");
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (tempUser.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    const newUser = new User({
      username: tempUser.username,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
    });

    await newUser.save();
    await tempUser.deleteOne({ email });
    res.status(200).json({ message: "User registered Successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in OTP verification", error: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    let tempUser = await TempUser.findOne({ email });

    if (!tempUser) {
      return res
        .status(404)
        .json({ message: "User not found please register again" });
    }

    const newOTP = generateOTP();
    const newOTPExpires = new Date(Date.now() + 60000);
    const newTempUser = new TempUser({
      username: tempUser.username,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      otp: newOTP,
      otpExpires: newOTPExpires,
    });

    const tempUserId = tempUser._id;
    await TempUser.findByIdAndDelete(tempUserId);

    console.log("Hii");
    await newTempUser.save();

    await sendOTPEmail(email, newOTP);

    res.status(200).json({ message: "New OTP send successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resending OTP", error: error.message });
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not exist" });
    }
    if (!user.active) {
      return res
        .status(403)
        .json({ message: "User is blocked Please contact support" });
    }

    const validPassword = await bcryptjs.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Password" });
    }
    // creating token
    const refreshToken = createRefreshToken(user);
    const accessToken = createAccessToken(user);

    const haveWallet = await Wallet.findOne({userId: user._id})

    if(!haveWallet) {
      const newWallet = new Wallet({
        userId: user._id,
        balance: 0,
        transactions: []
      })

      await newWallet.save()
    }

    res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 60 * 60 * 24 * 1000, // 1 day
      })
      .json({
        success: true,
        message: "You are logged in ",
        accessToken,
        data: {
          user: { userId: user._id, email: user.email, role: user.role },
        },
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
//////////////////////////
export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    const user = await User.findById(decoded.userId);
    const accessToken = createAccessToken(user);

    res.json({ accessToken });
  } catch (error) {
    res
      .status(403)
      .json({ message: "Invalid refresh token", error: error.message });
  }
};
export const adminRefreshToken = async (req, res) => {
  const refreshToken = req.cookies?.adminRefreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    const user = await User.findById(decoded.userId);
    const accessToken = createAccessToken(user);

    res.json({ accessToken });
  } catch (error) {
    res
      .status(403)
      .json({ message: "Invalid refresh token", error: error.message });
  }
};
//////////////////////////////////
export const logout = (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminSignin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(email, password);
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "This is not a valid admin" });
    }

    const validPassword = await bcryptjs.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Incorrect Password" });
    }

    const refreshToken = createRefreshToken(admin);
    const accessToken = createAccessToken(admin);

    res
      .status(200)
      .cookie("adminRefreshToken", refreshToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 24 * 1000,
      })
      .json({
        success: true,
        message: "Login Successful",
        accessToken,
        data: {
          admin: { adminId: admin._id, email: admin.email, role: admin.role },
        },
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
/////////////////////////////////////////
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("adminRefreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({ message: "Logout Successfull" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
///////////////////////////////////////////
export const resetPassword = async (req, res) => {
  const { email } = req.body;
  console.log(email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "This User not exist" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60000);
    console.log(otp, expiresAt);

    await Otp.create({
      userId: user._id,
      otp,
      expiresAt,
    });

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP send to the Email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
////////////////////////////////////////////
export const resetVerifyOTP = async (req, res) => {
  const { email, otpValue } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "This User not exist" });
    }

    const otpEntry = await Otp.findOne({ userId: user._id, otp: otpValue });

    if (!otpEntry) {
      return res.status(400).json({ messsage: "Invalid OTP" });
    }

    if (Otp.expiresAt < Date.now()) {
      return res.status(410).json({ message: "OTP Expired" });
    }
    otpEntry.verified = true;
    await otpEntry.save();

    res.status(200).json({ message: "OTP successfully verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPasswordReset = async (req, res) => {
  const { newPassword, email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "NO user is found" });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    await Otp.deleteMany({ userId: user._id });

    res.status(200).json({ message: "Password Reset Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
////////////////////////////////////////////////////
export const googleAuth = async (req, res) => {
  const { username, email } = req.body;

  console.log(username, email);
  try {
    const user = await User.findOne({ email });

    if (user) {
      const refreshToken = createRefreshToken(user);
      const accessToken = createAccessToken(user);

      const haveWallet = await Wallet.findOne({userId: user._id})

      if(!haveWallet) {
        const newWallet = new Wallet({
          userId: user._id,
          balance: 0,
          transactions: []
        })
        newWallet.save()
      }

      res
        .status(200)
        .cookie("refreshToken", refreshToken, {
          path: "/",
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 60 * 60 * 24 * 1000,
        })
        .json({
          success: true,
          message: "You are logged in ",
          accessToken,
          data: {
            user: { userId: user._id, email: user.email, role: user.role },
          },
        });
    } else {
      const hashedPassword = await bcryptjs.hash(`${email}${username}`, 10);

      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
      });
      const refreshToken = createRefreshToken(newUser);
      const accessToken = createAccessToken(newUser);

      const wallet = new Wallet({
        userId: newUser._id,
        balance: 0,
        transactions: []
      })

      wallet.save()

      res
        .status(200)
        .cookie("refreshToken", refreshToken, {
          path: "/",
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 60 * 60 * 24 * 1000, 
        })
        .json({
          success: true,
          message: "You are logged in ",
          accessToken,
          data: {
            user: {
              userId: newUser._id,
              email: newUser.email,
              role: newUser.role,
            },
          },
        });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
