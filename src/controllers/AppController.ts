import { Request, Response } from "express"
import dbClient from "../utils/db"
import redisClient from "../utils/redis"

export default class AppController{
  static getStatus = async (req: Request,res: Response) => {
    const redis = redisClient.isAlive()
    const db = await dbClient.isAlive()
  
    return res.json({redis, db})
  }
  
  static getStats = async (req: Request,res: Response) => {
    const users = await dbClient.nbUsers()
    const files = await dbClient.nbFiles()
  
    return res.json({users, files})
  }
}