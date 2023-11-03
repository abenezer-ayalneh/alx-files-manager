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
import { File } from './models/file.model'
import { plainToInstance } from 'class-transformer'

export default class FilesController {
  static async postUpload(req: Request, res: Response) {
    const user = req.user

    // Validating the request
    const requestData = plainToInstance(CreateFileDto, req.body)
    const errors = await validate(requestData)
    if (errors.length > 0) {
      return res.status(400).send(errors.map((error) => error.constraints))
    }

    // If no file is present in DB for this parentId, return an error Parent not found with a status code 400
    if (requestData.parentId && requestData.parentId !== '0') {
      const parentFolder = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOne({ _id: new ObjectId(requestData.parentId) })

      // If the file present in DB for this parentId is not of type folder, return an error Parent is not a folder with a status code 400
      if (!parentFolder) {
        return res.status(400).json({ error: 'Parent not found' })
      } else if (parentFolder.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' })
      }
    }

    // If the type is folder, add the new file document in the DB and return the new file with a status code 201
    if (requestData.type === 'folder') {
      const newFolder = await dbClient.mongoClient.db().collection('files').insertOne({
        name: requestData.name,
        type: requestData.type,
        parentId: requestData.parentId,
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
      // var file = Buffer.from(requestData.data, 'base64').toString('utf-8')
      const file = Buffer.from(requestData.data, 'base64')
      const filePath = join(folderPath, fileName)
      try {
        await writeFile(filePath, file)
      } catch (e) {
        return res.status(500).send({ error: "File: can't store the file" })
      }

      try {
        const newFile = await dbClient.mongoClient.db().collection('files').insertOne({
          userId: user._id,
          name: requestData.name,
          type: requestData.type,
          isPublic: requestData.isPublic,
          parentId: requestData.parentId,
          localPath: filePath,
        })

        return res.status(201).json(newFile)
      } catch (e) {
        return res.status(500).send({ error: "DB: can't store the document" })
      }
    }
  }

  static async getIndex(req: Request, res: Response) {
    const user = req.user
    const parentId = req.query.parentId as string | null
    // Number of files to show per page
    const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE ?? '20')
    // Page number to paginate with
    const page = (req.query.page ?? 0) as number
    // Calculate the skip value to determine where to start the page
    const skip = page * itemsPerPage
    // Query to run on the match section
    const query: Partial<File> = {}
    query.parentId = parentId ? new ObjectId(parentId) : null
    query.userId = user._id

    try {
      const files = await dbClient.mongoClient
        .db()
        .collection('files')
        .aggregate([
          {
            $match: query, // Apply the query for parent ID and the authenticated user
          },
          {
            $skip: skip, // Skip documents to start from a specific page
          },
          {
            $limit: itemsPerPage, // Limit the number of documents to fetch per page
          },
        ])
        .toArray()
      return res.status(200).json({ files })
    } catch (e) {
      return res.status(500).send({ error: "DB: couldn't fetch files" })
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
      return res.status(500).send({ error: "DB: couldn't fetch file" })
    }
  }

  static async putPublish(req: Request, res: Response) {
    const fileId = req.params.id

    try {
      const file = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOne({ _id: new ObjectId(fileId), userId: req.user._id })

      if (!file) {
        return res.status(404).send({ error: 'Not found' })
      }

      const updatedFile = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOneAndUpdate({ _id: new ObjectId(fileId) }, { $set: { isPublic: true } })

      return res.status(200).json({ file: updatedFile.value })
    } catch (e) {
      console.error(e)
      return res.status(500).send({ error: "DB: couldn't fetch file" })
    }
  }

  static async putUnpublish(req: Request, res: Response) {
    const fileId = req.params.id

    try {
      const file = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOne({ _id: new ObjectId(fileId), userId: req.user._id })

      if (!file) {
        return res.status(404).send({ error: 'Not found' })
      }

      const updatedFile = await dbClient.mongoClient
        .db()
        .collection('files')
        .findOneAndUpdate({ _id: new ObjectId(fileId) }, { $set: { isPublic: false } })

      return res.status(200).json({ file: updatedFile.value })
    } catch (e) {
      return res.status(500).send({ error: "DB: couldn't fetch file" })
    }
  }
}
