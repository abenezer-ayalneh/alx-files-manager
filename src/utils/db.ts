import { MongoClient } from 'mongodb'
require('dotenv').config()

class DBClient {
  mongoClient: MongoClient

  constructor() {
    this.mongoClient = new MongoClient(
      `mongodb://${process.env.MONGO_DB_USER ?? 'mongouser'}:${process.env.MONGO_DB_PASSWORD ?? 'passpass'}@${
        process.env.MONGO_DB_HOST ?? 'localhost'
      }:${process.env.MONGO_DB_PORT ?? 27017}?authMechanism=DEFAULT`
    )
    this.mongoClient.db(process.env.MONGO_DB_DATABASE ?? 'files_manager')
    this.mongoClient.connect()
  }

  async isAlive() {
    try {
      await this.mongoClient.db().admin().ping()
    } catch (error) {
      return false
    }

    return true
  }

  async nbUsers() {
    return await this.mongoClient.db().collection('users').countDocuments()
  }

  async nbFiles() {
    return await this.mongoClient.db().collection('files').countDocuments()
  }
}

const dbClient = new DBClient()
export default dbClient
