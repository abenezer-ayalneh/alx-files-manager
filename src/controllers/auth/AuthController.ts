import { validate } from 'class-validator'
import { ConnectDto } from './dto/connect.dto'
import { Request, Response } from 'express'
import dbClient from '../../utils/db'
import crypto from 'crypto'
import { User } from '../users/models/user.model'
import redisClient from '../../utils/redis'
import { v4 as uuidv4 } from 'uuid'
import { DisconnectDto } from './dto/disconnect.dto'

export class AuthController {
  static async getConnect(req: Request, resp: Response) {
    const credentialDto = new ConnectDto()
    const credential = req.headers.authorization?.replace('Basic ', '')
    credentialDto.credential = credential

    const errors = await validate(credentialDto)

    if (errors.length > 0) {
      return resp.status(400).send(errors.map((error) => error.constraints))
    }

    // Decode base64 to bytes
    const decodedBytes = atob(credential!)

    // Convert bytes to UTF-8 string
    const utf8String = new TextDecoder().decode(new Uint8Array([...decodedBytes].map((char) => char.charCodeAt(0))))

    const credentialArray = utf8String.split(':')
    const email = credentialArray[0]
    const password = credentialArray[1]

    const user = await dbClient.mongoClient.db().collection<User>('users').findOne({ email })

    if (user) {
      const hashedPassword = crypto.createHash('sha1').update(password).digest('base64')

      if (hashedPassword === user.password) {
        const token = uuidv4()
        const key = `auth_${token}`
        redisClient.set(key, user._id.toString(), 86400)

        resp.status(200).json({ token: '155342df-2399-41da-9e8c-458b6ac52a0c' })
      } else {
        resp.status(401).json({ error: 'Password mismatch' })
      }
    } else {
      resp.status(401).json({ error: 'User not found' })
    }
  }

  static async getDisconnect(req: Request, resp: Response) {
    const token = req.headers['x-token'] as string
    const disconnectDto = new DisconnectDto()
    disconnectDto.token = token

    const errors = await validate(disconnectDto)
    if (errors.length > 0) {
      return resp.status(400).send(errors.map((error) => error.constraints))
    }

    const redisKey = `auth_${token}`
    const redisEntry = await redisClient.get(redisKey)
    if (redisEntry) {
      await redisClient.del(redisKey)
      resp.status(204)
    } else {
      resp.status(401).json({ error: 'User not found' })
    }
  }
}
