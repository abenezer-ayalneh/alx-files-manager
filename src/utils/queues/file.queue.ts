import Bull, { Queue } from 'bull'
import { FILE_QUEUE } from '../queue.constants'
import dbClient from '../db'
import { ObjectId } from 'mongodb'
import imageThumbnail from 'image-thumbnail'
import { File } from '../../controllers/files/models/file.model'
import { writeFile } from 'fs/promises'
import * as process from 'process'

type FileQueueDataType = {
  fileId: ObjectId
  userId: ObjectId
}

export const fileQueue: Queue<FileQueueDataType> = new Bull(FILE_QUEUE, {
  redis: {
    username: process.env.REDIS_USERNAME,
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    password: process.env.REDIS_PASSWORD ?? 'password',
  },
})

fileQueue.process(async (job) => {
  return createThumbNail(job.data)
})

const createThumbNail = async (data: FileQueueDataType) => {
  const file = (await dbClient.mongoClient
    .db()
    .collection('files')
    .findOne({ _id: new ObjectId(data.fileId), userId: new ObjectId(data.userId) })) as File

  if (!file) {
    throw new Error('File not found')
  } else {
    try {
      if (file.localPath) {
        await generateAndStoreThumbnails(file.localPath, 500)
        await generateAndStoreThumbnails(file.localPath, 250)
        await generateAndStoreThumbnails(file.localPath, 100)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

const generateAndStoreThumbnails = async (path: string, width: number) => {
  const thumbnail = await imageThumbnail(path, { width: width, responseType: 'buffer' })
  const filePath = path + `_${width}`
  try {
    await writeFile(filePath, thumbnail)
  } catch (e) {
    throw new Error("File: can't store the file")
  }
}
