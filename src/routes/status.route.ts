import express, { Request, Response } from 'express'
import AppController from '../controllers/app/AppController'

export const router = express.Router()

router.get('/', (req: Request, res: Response) => res.send('Hello World!'))
router.get('/status', AppController.getStatus)
router.get('/stats', AppController.getStats)
