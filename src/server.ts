import express from 'express'

if (!process.env['PORT']) throw new Error('PORT not set')

const app = express()

app.get('/ping', function (_, response) {
    response.send('pong')
})

app.listen(parseInt(process.env['PORT']), () => {
    console.log(`Web server started on port ${process.env['PORT']}`)
})
