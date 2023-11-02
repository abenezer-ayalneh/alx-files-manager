import { CreateFileDto } from './dto/create-file.dto'
import { validate } from 'class-validator'
import dbClient from '../../utils/db'
import { ObjectId } from 'mongodb'
import { writeFile } from 'fs/promises'
import * as process from 'process'
import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { Request, Response } from 'express'

export default class FilesController {
  static async postUpload(req: Request, res: Response) {
    const user = req.user

    // Validating the
    const errors = await this.requestValidation(req.body)
    if (errors.length > 0) {
      return res.status(400).send(errors.map((error) => error.constraints))
    }

    // If no file is present in DB for this parentId, return an error Parent not found with a status code 400
    if (req.body.parentId) {
      const parentFolder = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOne({ _id: new ObjectId(req.body.parentId) })

      // If the file present in DB for this parentId is not of type folder, return an error Parent is not a folder with a status code 400
      if (!parentFolder) {
        return res.status(400).json({ error: 'Parent not found' })
      } else if (parentFolder.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' })
      }
    }

    // If the type is folder, add the new file document in the DB and return the new file with a status code 201
    if (req.body.type === 'folder') {
      const newFolder = await dbClient.mongoClient.db().collection('files').insertOne({
        name: req.body.name,
        type: req.body.type,
        parentId: req.body.parentId,
      })

      return res.status(201).json(newFolder)
    } else {
      // The relative path of this folder is given by the environment variable FOLDER_PATH
      // If this variable is not present or empty, use /tmp/files_manager as storing folder path
      const folderPath = process.env.FOLDER_PATH ?? '/tmp/files_manager'
      if (!existsSync(folderPath)) {
        mkdirSync(folderPath)
      }

      // Create a local path in the storing folder with filename a UUID
      const fileName = uuidv4()

      // Store the file in clear (reminder: data contains the Base64 of the file) in this local path
      // var file = Buffer.from(req.body.data, 'base64').toString('utf-8')
      var file = Buffer.from(req.body.data, 'base64')
      const filePath = join(folderPath, fileName)
      try {
        await writeFile(filePath, file)
      } catch (e) {
        return res.status(500).send({ error: "File: can't store the file" })
      }

      try {
        const newFile = await dbClient.mongoClient.db().collection('files').insertOne({
          userId: user._id,
          name: req.body.name,
          type: req.body.type,
          isPublic: req.body.isPublic,
          parentId: req.body.parentId,
          localPath: filePath,
        })

        return res.status(201).json(newFile)
      } catch (e) {
        return res.status(500).send({ error: "DB: can't store the document" })
      }
    }
  }

  static async getIndex(req: Request, res: Response) {
    const parentId = req.body.parentId
    const page = req.body.page
    const files = []

    if (parentId) {
    }
  }

  static async getShow(req: Request, res: Response) {
    const fileId = req.params.id

    try {
      const file = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOne({ _id: new ObjectId(fileId), userId: req.user._id })

      if (!file) {
        return res.status(404).send({ error: 'Not found' })
      }

      return res.status(200).json({ file })
    } catch (e) {

    }
  }

  private static async requestValidation(body: any) {
    const createFileDto = new CreateFileDto()
    createFileDto.name = body.name
    createFileDto.type = body.type
    createFileDto.parentId = body.parentId
    createFileDto.isPublic = body.isPublic
    createFileDto.data = body.data

    return await validate(createFileDto)
  }
}
