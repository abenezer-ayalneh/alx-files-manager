import Bull, { Queue } from 'bull'
import { USER_QUEUE } from '../queue.constants'
import dbClient from '../db'
import { ObjectId } from 'mongodb'
import { User } from '../../controllers/users/models/user.model'
import * as process from 'process'
import nodemailer from 'nodemailer'

type UserQueueDataType = {
  userId: ObjectId
}

export const userQueue: Queue<UserQueueDataType> = new Bull(USER_QUEUE, {
  redis: {
    username: process.env.REDIS_USERNAME,
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    password: process.env.REDIS_PASSWORD ?? 'password',
  },
})

userQueue.process(async (job) => {
  return sendWelcomeMail(job.data)
})

const sendWelcomeMail = async (data: UserQueueDataType) => {
  const user = (await dbClient.mongoClient
    .db()
    .collection('users')
    .findOne({ _id: new ObjectId(data.userId) })) as User

  if (!user) {
    throw new Error('User not found')
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST ?? 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.MAIL_PORT ?? '2525'),
        auth: {
          user: process.env.MAIL_USER ?? '4c720ec91875a6',
          pass: process.env.MAIL_PASSWORD ?? '6d0adaea9369f7',
        },
      })

      await transporter.sendMail({
        from: process.env.MAIL_FROM ?? 'support@files-manager.com',
        to: 'bar@example.com, baz@example.com', // list of receivers
        subject: `Welcome`, // Subject line
        text: `Welcome, ${user.email}! We would like to thank you for using our platform`, // plain text body
      })
    } catch (err) {
      console.error({ err })
    }
  }
}
