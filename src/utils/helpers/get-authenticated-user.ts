import redisClient from '../redis'
import dbClient from '../db'
import { ObjectId } from 'mongodb'

export const getAuthenticatedUser = async (token: string) => {
  const userId = await redisClient.get(`auth_${token}`)
  if (userId) {
    return await dbClient.mongoClient
      .db()
      .collection('users')
      .findOne({ _id: new ObjectId(userId) })
  }

  return null
}
