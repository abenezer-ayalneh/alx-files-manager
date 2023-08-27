import { validate } from 'class-validator'
import { Request, Response } from 'express'
import dbClient from '../../utils/db'
import { CreateUserDto } from './dto/create-user.dto'
import crypto from 'crypto'

export default class UsersController {
  static postNew = async (req: Request, resp: Response) => {
    console.log({ body: req.body })
    const createUserDto = new CreateUserDto()
    createUserDto.email = req.body?.email
    createUserDto.password = req.body?.password

    const errors = await validate(createUserDto)
    if (errors.length > 0) {
      return resp.status(400).send(errors[0].constraints)
    }

    const emailExists = await dbClient.mongoClient
      .db()
      .collection('users')
      .findOne({ email: req.body?.email })
    if (emailExists) {
      resp.status(400).send('Already exist')
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
      return user
    } catch (error) {
      console.error({ error })
    }
  }
}
