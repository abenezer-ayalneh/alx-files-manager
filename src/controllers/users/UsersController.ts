import { validate } from 'class-validator'
import { Request, Response } from 'express'
import dbClient from '../../utils/db'
import { CreateUserDto } from './dto/create-user.dto'
import crypto from 'crypto'
import { getAuthenticatedUser } from '../../utils/helpers/get-authenticated-user'

export default class UsersController {
  static async postNew(req: Request, resp: Response) {
    const createUserDto = new CreateUserDto()
    createUserDto.email = req.body?.email
    createUserDto.password = req.body?.password

    const errors = await validate(createUserDto)
    if (errors.length > 0) {
      return resp.status(400).send(errors.map((error) => error.constraints))
    }

    const emailExists = await dbClient.mongoClient
      .db()
      .collection('users')
      .findOne({ email: req.body?.email })
    if (emailExists) {
      resp.status(400).json({ error: 'Already exist' })
    }

    const hashedPassword = crypto
      .createHash('sha1')
      .update(req.body?.password)
      .digest('base64')

    try {
      const user = await dbClient.mongoClient
        .db()
        .collection('users')
        .insertOne({ email: req.body?.email, password: hashedPassword })
      resp.json(user)
    } catch (error) {
      console.error({ error })
    }
  }

  static async me(req: Request, resp: Response) {
    const token = req.headers['x-token'] as string

    if (token) {
      try {
        const user = await getAuthenticatedUser(token)

        if (user) {
          resp.status(200).json({ id: user._id, email: user.email })
        } else {
          resp.status(401).json({ error: 'Unauthorized' })
        }
      } catch (e) {
        resp.status(401).json({ error: 'Unauthorized' })
      }
    } else {
      resp.status(401).json({ error: 'Unauthorized' })
    }
  }
}
