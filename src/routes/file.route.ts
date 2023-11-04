import express from 'express'
import FilesController from '../controllers/files/FilesController'

export const filesRouter = express.Router()

filesRouter.post('/', FilesController.postUpload)
filesRouter.get('/', FilesController.getIndex)
filesRouter.get('/:id', FilesController.getShow)
filesRouter.put('/:id/publish', FilesController.putPublish)
filesRouter.put('/:id/unpublish', FilesController.putUnpublish)
filesRouter.get('/:id/data', FilesController.getFile)
