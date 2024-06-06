import { InferSchemaType, Schema } from 'mongoose'

import ranks from '@/data/ranks'
import suits from '@/data/suits'
import database from '@/services/database'

export const CardSchema = new Schema({
    rank: {
        type: String,
        enum: ranks,
        required: true,
    },
    suit: {
        type: String,
        enum: suits,
        required: true,
    },
})

export const CardModel = database.connection.model('card', CardSchema)

export type CardType = InferSchemaType<typeof CardSchema>
