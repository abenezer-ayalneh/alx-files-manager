import { ObjectId } from "mongodb";

export class User {
  _id: ObjectId
  email?: string
  password?: string
}
