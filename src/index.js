const express = require('express')
const routes = require('./router/router')

const app = express()

app.use(express.json())

app.use(routes)

app.listen(3000)