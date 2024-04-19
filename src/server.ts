import express from 'express'

const app = express()

app.get('/ping', function (_, response) {
    response.send('pong')
})

app.listen(3000)
