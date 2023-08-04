import { RedisCommandArgument } from '@redis/client/dist/lib/commands'
import { RedisClientType, createClient } from 'redis'
require('dotenv').config()

class RedisClient {
  redisClient: RedisClientType

  constructor() {
    this.redisClient = createClient({
      url: `redis://${process.env.REDIS_USERNAME ?? 'root'}:${process.env.REDIS_PASSWORD ?? 'passpass'}@${
        process.env.REDIS_HOST ?? 'localhost'
      }:${process.env.REDIS_PORT ?? 6379}`,
    })
    this.redisClient.on('error', (err) => console.log('Redis Client Error', err))
    this.redisClient.connect()
  }

  isAlive() {
    return this.redisClient.isReady
  }

  async get(key: string) {
    const value = await this.redisClient.get(key)
    return value
  }

  async set(key: RedisCommandArgument, value: number | RedisCommandArgument, duration: number = 5) {
    await this.redisClient.set(key, value, { EX: duration })
  }

  async del(key: RedisCommandArgument) {
    await this.redisClient.del(key)
  }
}

const redisClient = new RedisClient()
export default redisClient
