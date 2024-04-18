import mongoose from 'mongoose'

import { ClientModel } from '@/models/client'
import { PredictionModel } from '@/models/prediction'
import { TransactionModel } from '@/models/transaction'
import { Stock } from '@/types'

export class Database {
    constructor(uri: string) {
        void mongoose.connect(uri)
    }

    async getClientByUserId(clientId: string) {
        const client = await ClientModel.findOneAndUpdate(
            { clientId },
            { clientId },
            { upsert: true, new: true },
        )
        return client
    }

    async getAllClients() {
        const clients = await ClientModel.find()
        return clients
    }

    async getTransactionsByDate(clientId: string, start: Date, end: Date) {
        const transactions = await TransactionModel.find({
            clientId,
            date: { $gte: start, $lt: end },
        })
        return transactions
    }

    async getPredictionById(predictionId: string) {
        const prediction = await PredictionModel.findById(predictionId)
        if (!prediction) throw new Error('Failed to get prediction')
        return prediction
    }

    async postTransaction(clientId: string, shares: Stock[]) {
        const transaction = await TransactionModel.create({
            clientId,
            shares,
        })
        return transaction
    }

    async postPrediction(question: string, options: string[]) {
        const prediction = await PredictionModel.create({
            question,
            options,
        })
        return prediction
    }
}

if (!process.env['MONGODB_URI']) throw new Error('MONGODB_URI not set')

const database = new Database(process.env['MONGODB_URI'])

export default database
