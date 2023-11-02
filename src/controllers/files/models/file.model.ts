import { ObjectId } from "mongodb";

export class File {
  _id: ObjectId
  userId: string
  name: string
  type: string
  isPublic?: string
  parentId?:  number
  localPath?: string
}
