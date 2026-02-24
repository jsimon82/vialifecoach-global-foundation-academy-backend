import * as UserModel from "../models/User.model.js";
import bcrypt from "bcrypt";

//  ======== CREATING USER ============= 
export async function createUserController(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await UserModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ===== hash password =======
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await UserModel.createUser(name, email, hashedPassword, role);

    res.status(201).json({ message: "User created", userId });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// =========== GET USER BY ID ==========
export async function getUserByIdController(req, res) {
  try {
    const { id } = req.params;
    const user = await UserModel.findUserById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// =========== UPDATE USER ==============
export async function updateUserController(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await UserModel.updateUser(id, updates);

    if (updated === 0) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// =========== DELETE USER ==============
export async function deleteUserController(req, res) {
  try {
    const { id } = req.params;

    const deleted = await UserModel.deleteUser(id);

    if (deleted === 0) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
}



