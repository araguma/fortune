import { InferSchemaType, Schema, model } from 'mongoose'

export type Prediction = InferSchemaType<typeof PredictionSchema>

export const PredictionSchema = new Schema({
    status: {
        type: String,
        enum: ['opened', 'closed', 'settled'],
        default: 'opened',
    },
    question: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        default: [],
    },
    bets: {
        type: Map,
        of: {
            option: {
                type: Number,
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
        },
        default: {},
    },
})

export const PredictionModel = model('prediction', PredictionSchema)
