import express from 'express'
import {statusRouter} from './routes/status.route'
import {usersRouter} from './routes/user.route'
require('dotenv').config()

const app = express()
app.use(express.json())
app.use('/', statusRouter)
app.use('/users', usersRouter)

app.listen(process.env.APP_PORT ?? 5000)

