import { InferSchemaType, Schema } from 'mongoose'

import database from '@/services/database'

export const ServerSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    whitelists: {
        type: Map,
        of: [String],
        default: {},
    },
})

export const ServerModel = database.connection.model('server', ServerSchema)

export type ServerType = InferSchemaType<typeof ServerSchema>
