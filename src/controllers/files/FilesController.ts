import { Request, Response } from 'express'
import { getAuthenticatedUser } from '../../utils/helpers/get-authenticated-user'
import { CreateFileDto } from './dto/create-file.dto'
import { validate } from 'class-validator'
import dbClient from '../../utils/db'
import { ObjectId } from 'mongodb'
import { writeFile } from 'fs/promises'
import * as process from 'process'
import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'

export default class FilesController {
  static async postUpload(req: Request, resp: Response) {
    const token = req.headers['x-token'] as string

    if (token) {
      const user = await getAuthenticatedUser(token)

      if (user && req.body) {
        const createFileDto = new CreateFileDto()
        createFileDto.name = req.body.name
        createFileDto.type = req.body.type
        createFileDto.parentId = req.body.parentId
        createFileDto.isPublic = req.body.isPublic
        createFileDto.data = req.body.data

        const errors = await validate(createFileDto)
        if (errors.length > 0) {
          return resp.status(400).send(errors.map((error) => error.constraints))
        }

        // If no file is present in DB for this parentId, return an error Parent not found with a status code 400
        if (req.body.parentId) {
          const parentFolder = await dbClient.mongoClient
            .db()
            .collection('files')
            .findOne({ _id: new ObjectId(req.body.parentId) })

          // If the file present in DB for this parentId is not of type folder, return an error Parent is not a folder with a status code 400
          if (!parentFolder) {
            resp.status(400).json({ error: 'Parent not found' })
          } else if (parentFolder.type !== 'folder') {
            resp.status(400).json({ error: 'Parent is not a folder' })
          }

          // If the type is folder, add the new file document in the DB and return the new file with a status code 201
          if (req.body.type === 'folder') {
            const newFolder = await dbClient.mongoClient.db().collection('files').insertOne({
              name: req.body.name,
              type: req.body.type,
              parentId: req.body.parentId,
            })

            resp.status(201).json(newFolder)
          } else {
            // The relative path of this folder is given by the environment variable FOLDER_PATH
            // If this variable is not present or empty, use /tmp/files_manager as storing folder path
            const folderPath = process.env.FOLDER_PATH ?? '/tmp/files_manager'

            // Create a local path in the storing folder with filename a UUID
            const fileFolderName = uuidv4()

            // Store the file in clear (reminder: data contains the Base64 of the file) in this local path
            var file = Buffer.from(req.body.data, 'base64')
            const filePath = join(folderPath, fileFolderName, req.body.name)
            await writeFile(filePath, file)

            const newFile = await dbClient.mongoClient.db().collection('files').insertOne({
              userId: user._id,
              name: req.body.name,
              type: req.body.type,
              isPublic: req.body.isPublic,
              parentId: req.body.parentId,
              localPath: filePath,
            })

            resp.status(201).json(newFile)
          }
        }
      } else {
        resp.status(401).json({ error: 'Unauthorized' })
      }
    } else {
      resp.status(401).json({ error: 'Token not specified' })
    }
  }
}
