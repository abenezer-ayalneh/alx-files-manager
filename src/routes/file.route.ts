import express, { Request, Response } from 'express'
import FilesController from "../controllers/files/FilesController";

export const filesRouter = express.Router()

filesRouter.post('/', FilesController.postUpload)