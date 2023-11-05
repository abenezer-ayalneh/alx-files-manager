import 'reflect-metadata';
import express from 'express'
import {statusRouter} from './routes/status.route'
import {usersRouter} from './routes/user.route'
import {authRouter} from './routes/auth.route'
import { filesRouter } from "./routes/file.route";
import { authMiddleware } from "./utils/middlewares/auth.middleware";
require('dotenv').config()

const app = express()
app.use(express.json({limit: "50mb"}))
app.use('/', statusRouter)
app.use('/auth', authRouter)
app.use(authMiddleware)
app.use('/users', usersRouter)
app.use('/files', filesRouter)

app.listen(process.env.APP_PORT ?? 5000, () => console.log(`Application listening on port ${process.env.APP_PORT ?? 5000}`))

