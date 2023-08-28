import express, { Request, Response } from 'express'
import {AuthController} from '../controllers/auth/AuthController'

export const authRouter = express.Router()

authRouter.get('/connect', AuthController.getConnect)
authRouter.get('/disconnect', AuthController.getDisconnect)
authRouter.get('/users/me', (req: Request, res: Response) => res.send('Hello World!'))
