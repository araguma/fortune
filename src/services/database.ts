import mongoose, { Connection } from 'mongoose'

import { getEnvironmentVariable } from '@/libs/env'
import log from '@/libs/log'

export class Database {
    public connection: Connection

    public constructor(uri: string) {
        this.connection = mongoose.createConnection(uri)
        this.connection.on('error', (error) => {
            this.handleError(error)
        })
        this.connection.on('connected', () => {
            this.handleConnected()
        })
    }

    public handleError(error: unknown) {
        log.error('MongoDB connection error:', error)
    }

    public handleConnected() {
        const { host, port, name } = this.connection
        const uri = `mongodb://${host}:${port}/${name}`
        log.success(`Connected to MongoDB`)
        log.info(`├─ URI: ${uri}`)
        log.info(`├─ Models: ${Object.keys(this.connection.models).length}`)
        log.info(`└─ Collections: ${Object.keys(this.connection.collections).length}`)
    }
}

const database = new Database(getEnvironmentVariable('MONGODB_URI'))

export default database
