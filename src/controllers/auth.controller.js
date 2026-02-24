import "../config/env.js";
import { findUserByEmail,createUser, verifyUser } from "../models/User.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/asyncHelpers.js";
import { generateAccessToken } from "../utils/utils.jwt.js";
import { Token } from "../models/Token.model.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../services/email.service.js";
import { validateAdminCredentials, getAdminCredentials } from "../utils/adminCredentials.js";

const ADMIN_EMAIL = getAdminCredentials().email;

// ======= LOGIN CONTROLLER =======
export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // ======= ADMIN LOGIN (using encoded credentials) =======
    if (validateAdminCredentials(email, password)) {
      const adminUser = { id: 0, name: "Admin", email: "academy@vialifecoach.org", role: "admin" };
      const accessToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
      const refreshToken = jwt.sign({ email: adminUser.email }, process.env.REFRESH_TOKEN_SECRET);

      await Token.findOneAndUpdate(
        { userEmail: adminUser.email },
        { refreshToken, createdAt: new Date() },
        { upsert: true, new: true }
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        accessToken,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        }
      });
    }
    // ======= END ADMIN LOGIN =======

    const user = await findUserByEmail(email);
    if (!user) throw new AppError("User not found", 404);

    // check password
    const isValidUser = await bcrypt.compare(password, user.password_hash);
    if (!isValidUser) throw new AppError("Invalid email or password", 401);

    // generate tokens
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET);

    // ========== replace old refreshToken with new one (per user)
    await Token.findOneAndUpdate(
      { userEmail: user.email }, 
      { refreshToken, createdAt: new Date() }, 
      { upsert: true, new: true }
    );

    // httponly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // set to true in production
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
});

// ======= LOGOUT CONTROLLER =======
export const logout = catchAsync(async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "Refresh token required" });

    // remove refresh token
    await Token.deleteOne({ refreshToken: token });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.sendStatus(204);
});

// ==== REFRESH TOKEN CONTROLLER ====

export const getRefreshToken = catchAsync(async (req, res) => {
  const  token = req.cookies.refreshToken ;
  // console.log("Request Cookies:", req.headers.cookie);
  // console.log("Cookie Token:", token);
  if (!token) return res.status(401).json({ message: "Refresh token required" });

  const storedToken = await Token.findOne({ refreshToken: token });
  console.log("Stored Token:", storedToken);
  if (!storedToken) return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid refresh token" });

    // ======= ADMIN TOKEN REFRESH =======
    if (user.email === ADMIN_EMAIL) {
      const accessToken = generateAccessToken({ id: 0, email: ADMIN_EMAIL, role: "admin" });
      return res.json({ accessToken });
    }
    // ======= END ADMIN TOKEN REFRESH =======

    const currentUser = await findUserByEmail(user.email);
    if (!currentUser) return res.status(404).json({ message: "User not found" });
    const accessToken = generateAccessToken({ id: currentUser.id, email: currentUser.email, role: currentUser.role });
    res.json({ accessToken });
  });
});

//  ======== CREATING USER (SIGN UP USER) ============= 

export async function signupUserController(req, res) {
  console.log("Its hitting the signup controller");
  try {
    const { name, email, password} = req.body;

    // simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ===== hash password =======
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    const userId = await createUser(name, email, hashedPassword, "student", code, expiry);

    // send email with code
    await sendVerificationEmail(email, code);

    res.status(201).json({ message: "Registration successull, please confirm your email"});
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======= GET CURRENT USER CONTROLLER =======

export const getMe = catchAsync(async (req, res) => {
    // ======= ADMIN USER CHECK =======
    if (req.user.email === ADMIN_EMAIL) {
      return res.json({
        id: 0,
        name: "Admin",
        email: ADMIN_EMAIL,
        photo: null,
        role: "admin",
        verified: true,
      });
    }
    // ======= END ADMIN USER CHECK =======

    const user = await findUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo_url,
      role: user.role,
      verified: user.verified,
    });
});

// ===== VERIFY 

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  const user = await findUserByEmail(email);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.verification_token !== code || new Date() > user.verification_expires) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  await verifyUser(user.id);
  res.json({ message: "Email verified successfully!" });
};
