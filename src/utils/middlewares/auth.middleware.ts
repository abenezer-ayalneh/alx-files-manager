import { NextFunction, Request, Response } from 'express'
import redisClient from '../redis'
import dbClient from '../db'
import { ObjectId } from 'mongodb'
import { User } from "../../controllers/users/models/user.model";

declare module "express-serve-static-core" {
  interface Request {
    user: User;
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-token'] as string

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: token not specified' })
  }

  const userId = await redisClient.get(`auth_${token}`)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: user not found' })
  }

  try {
    const user = await dbClient.mongoClient
      .db()
      .collection('users')
      .findOne({ _id: new ObjectId(userId) })

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: user not found' })
    } else {
      delete user.password
      req.user = user
      next()
    }
  } catch (e) {
    return res.status(500).json({ error: 'DB: couldn\'t fetch user' })
  }
}
