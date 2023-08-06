import express from 'express'
import {router} from './routes/status.route'
require('dotenv').config()

const app = express()
app.use('/', router)

app.listen(process.env.APP_PORT ?? 5000)

