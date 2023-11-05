import { ObjectId } from "mongodb";

export class File {
  _id: ObjectId
  userId: ObjectId
  name: string
  type: string
  isPublic?: string
  parentId:  ObjectId | string
  localPath?: string
}
