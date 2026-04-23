import { Router } from "express"
import { login, logout, getRefreshToken, getMe, signupUserController, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/auth.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

const authRouter = Router()

authRouter.post("/auth/login",login)
authRouter.post("/admin/auth/login",login)
authRouter.post("/auth/signup",signupUserController)
authRouter.post("/auth/verify-email",verifyEmail)
authRouter.post("/auth/resend-verification",resendVerification)
authRouter.post("/auth/forgot-password",forgotPassword)
authRouter.post("/auth/reset-password",resetPassword)
authRouter.post("/auth/refresh-token",getRefreshToken)
authRouter.post("/admin/auth/refresh-token",getRefreshToken)
authRouter.delete("/auth/logout",logout)  
authRouter.get("/auth/me",authenticateToken,getMe)
authRouter.get("/admin/auth/me",authenticateToken,getMe)
export default authRouter
