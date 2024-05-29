import { InferSchemaType, Schema } from 'mongoose'

import database from '@/services/database'
import suits from '@/data/suits'
import ranks from '@/data/ranks'

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
