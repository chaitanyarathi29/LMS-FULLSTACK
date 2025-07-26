import express from 'express';
import { activateUser, loginUser, logoutUser, getUserInfo, registrationUser, socialAuth, updateUserInfo, updatePassword, updateAvatar } from '../controllers/user.controller';
import { authorizeRoles, isAuthenticated, updateAccessToken } from '../middleware/auth';
const userRouter = express.Router();

userRouter.post('/registration', registrationUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/login-user', loginUser);

userRouter.get('/logout-user' ,isAuthenticated, logoutUser);

userRouter.get('/refresh-token',updateAccessToken);

userRouter.get("/profile-info", isAuthenticated, getUserInfo);

userRouter.post("/social-auth",socialAuth);

userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);

userRouter.put('/update-user-password', isAuthenticated, updatePassword);

userRouter.put('/update-user-avatar', isAuthenticated, updateAvatar);

export default userRouter;