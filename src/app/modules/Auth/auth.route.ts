import express from 'express';
import { UserController } from './auth.controller';
const router = express.Router();

router.post("/", UserController.createUser)

router.post(
  '/getAuthorize',
  UserController.loginUser,
);

export const AuthRoutes = router;