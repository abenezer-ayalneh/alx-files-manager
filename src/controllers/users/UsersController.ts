import { Request, Response } from "express";

export default class UsersController {
  static postNew = async (req: Request, resp: Response) => {
    if (!req.body.email) {
      return resp.send('Missing email').status(422)
    }
    if (!req.body.password) {
      return resp.send('Missing password').status(422)
    }
  }
}