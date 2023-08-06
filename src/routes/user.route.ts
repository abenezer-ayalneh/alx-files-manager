import express, { Request, Response } from 'express'
import UsersController from '../controllers/users/UsersController'

export const router = express.Router()

router.post('/', UsersController.postNew)
