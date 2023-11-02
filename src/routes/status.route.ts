import express, { Request, Response } from 'express'
import AppController from '../controllers/app/AppController'

export const statusRouter = express.Router()

statusRouter.get('/', (req: Request, res: Response) => res.send('Hello World from Root!'))
statusRouter.get('/status', AppController.getStatus)
statusRouter.get('/stats', AppController.getStats)
