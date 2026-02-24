import { Router } from "express"
import { login, logout, getRefreshToken, getMe, signupUserController } from "../controllers/auth.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

const authRouter = Router()


authRouter.post("/auth/login",login)
authRouter.post("/auth/signup",signupUserController)
authRouter.post("/auth/refresh-token",getRefreshToken)
authRouter.delete("/auth/logout",logout)  
authRouter.get("/auth/me",authenticateToken,getMe)
export default authRouter