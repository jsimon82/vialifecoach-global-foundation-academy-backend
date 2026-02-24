import express from "express";
import {
  createUserController,
  getUserByIdController,
  updateUserController,
  deleteUserController
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/users", createUserController);
userRouter.get("/users/:id", getUserByIdController);
userRouter.put("users/:id", updateUserController);
userRouter.delete("users/:id", deleteUserController);

export default userRouter;
