import { validate } from 'class-validator'
import { Request, Response } from 'express'
import dbClient from '../../utils/db'
import { CreateUserDto } from './dto/create-user.dto'
import crypto from 'crypto'

export default class UsersController {
  static async postNew(req: Request, res: Response) {
    const createUserDto = new CreateUserDto()
    createUserDto.email = req.body?.email
    createUserDto.password = req.body?.password

    const errors = await validate(createUserDto)
    if (errors.length > 0) {
      return res.status(400).send(errors.map((error) => error.constraints))
    }

    const emailExists = await dbClient.mongoClient
      .db()
      .collection('users')
      .findOne({ email: req.body?.email })
    if (emailExists) {
      res.status(400).json({ error: 'Already exist' })
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
      res.json(user)
    } catch (error) {
      console.error({ error })
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const user = req.user

      res.status(200).json({ id: user._id, email: user.email })
    } catch (e) {
      res.status(401).json({ error: 'Unauthorized' })
    }
  }
}
