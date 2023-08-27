import express, { Request, Response } from 'express'
import UsersController from '../controllers/users/UsersController'

export const usersRouter = express.Router()

usersRouter.post('', UsersController.postNew)
