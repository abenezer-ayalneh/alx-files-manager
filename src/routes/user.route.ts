import express, { Request, Response } from 'express'
import UsersController from '../controllers/users/UsersController'
import { authRouter } from "./auth.route";

export const usersRouter = express.Router()

usersRouter.post('/', UsersController.postNew)
usersRouter.get('/me', UsersController.me)
