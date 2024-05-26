import { HydratedDocument } from 'mongoose'
import prettyMilliseconds from 'pretty-ms'

import symbols from '@/data/symbols'
import UserError from '@/errors/user'
import codec from '@/libs/codec'
import { getEnvironmentVariable } from '@/libs/env'
import random from '@/libs/random'
import { ClientModel, ClientType } from '@/models/client'
import { TransactionType } from '@/models/transaction'
import Transaction from '@/services/transaction'
import yahoo from '@/services/yahoo'

const CLAIM_INTERVAL = parseInt(getEnvironmentVariable('CLAIM_INTERVAL'))
const CLAIM_STOCKPILE_LIMIT = parseInt(
    getEnvironmentVariable('CLAIM_STOCKPILE_LIMIT'),
)
const FRACTION_DIGITS = parseInt(getEnvironmentVariable('FRACTION_DIGITS'))

const epsilon = Math.pow(10, -(FRACTION_DIGITS + 1))

export default class Client {
    public constructor(public model: HydratedDocument<ClientType>) {}

    public static async findById(id: string) {
        const client = await ClientModel.findById(id)
        if (!client) throw new Error('Client not found')
        return new Client(client)
    }

    public static async getClientByUserId(userId: string) {
        const client = await ClientModel.findOneAndUpdate(
            { userId },
            { userId },
            { upsert: true, new: true },
        )
        return new Client(client)
    }

    public static async getAllClients() {
        const clients = await ClientModel.find()
        return clients.map((client) => new Client(client))
    }

    private modifyPortfolio(
        symbol: string,
        shares: number,
        price: number,
        cost: number,
    ) {
        const key = codec.encode(symbol)
        const previous = this.model.portfolio.get(key) ?? {
            shares: 0,
            seed: 0,
            lastSplit: new Date(),
        }

        if (-shares > 0 && previous.shares < -shares)
            UserError.insufficientShares(symbol)
        if (cost > 0 && this.model.balance < cost)
            UserError.insufficientBalance()

        const current = {
            shares: previous.shares + shares,
            seed: previous.seed + shares * price,
            lastSplit: previous.lastSplit,
        }

        if (current.shares === 0) {
            this.model.portfolio.delete(key)
        } else {
            this.model.portfolio.set(key, current)
        }
        this.model.balance -= cost
    }

    private async splitStocks() {
        const start = new Date()
        const end = new Date()
        start.setDate(end.getDate() - 365 * 5)

        await Promise.all(
            Array.from(this.model.portfolio.entries()).map(
                async ([symbol, stock]) => {
                    const chart = await yahoo.getChart(
                        codec.decode(symbol),
                        start,
                        end,
                        '3mo',
                    )
                    const splits = chart.events?.splits
                    if (!splits) return
                    const split = splits[splits.length - 1]
                    if (!split) return
                    const splitDate = new Date(split.date)
                    if (splitDate > stock.lastSplit) {
                        const ratio = split.numerator / split.denominator
                        stock.shares *= ratio
                        stock.seed *= ratio
                        stock.lastSplit = splitDate
                        this.model.portfolio.set(symbol, stock)
                    }
                },
            ),
        )
    }

    public async updatePortfolio() {
        await this.splitStocks()
    }

    public async executeTransaction(transaction: TransactionType) {
        await this.updatePortfolio()
        if (transaction.userId !== this.model.userId)
            throw new Error('Invalid user ID')

        if (transaction.type === 'claim') {
            transaction.stocks.forEach((stock) => {
                this.modifyPortfolio(stock.symbol, stock.shares, stock.price, 0)
            })
        } else {
            const sign = transaction.type === 'buy' ? 1 : -1
            transaction.stocks.forEach((stock) => {
                this.modifyPortfolio(
                    stock.symbol,
                    sign * stock.shares,
                    stock.price,
                    sign * stock.shares * stock.price,
                )
            })
        }
    }

    public async claim() {
        const transaction = Transaction.create(this.model.userId, 'claim')

        const lastClaim = this.model.lastClaim.getTime()
        const offset = (Date.now() - lastClaim) % CLAIM_INTERVAL
        this.model.claims += Math.min(
            Math.floor((Date.now() - lastClaim) / CLAIM_INTERVAL),
            CLAIM_STOCKPILE_LIMIT,
        )

        if (this.model.claims <= 0) {
            const timeLeft = prettyMilliseconds(
                CLAIM_INTERVAL - (Date.now() - lastClaim),
            )
            UserError.noClaims(timeLeft)
        }

        for (let i = 0; i < this.model.claims; i++) {
            const symbol = random.sample(symbols)
            const shares = Math.floor(Math.random() * 19 + 1) / 10
            const price = await yahoo.getPrice(symbol)
            if (!price) UserError.noPrice(symbol)
            transaction.addStock(symbol, shares, price)
        }
        this.model.claims = 0
        this.model.lastClaim = new Date(Date.now() - offset)

        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async buyMax(symbol: string) {
        const transaction = Transaction.create(this.model.userId, 'buy')
        const price = await yahoo.getPrice(symbol)
        const shares =
            this.model.balance > epsilon
                ? (this.model.balance - epsilon) / price
                : 0
        transaction.addStock(symbol, shares, price)
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async buyShares(symbol: string, shares: number) {
        const transaction = Transaction.create(this.model.userId, 'buy')
        const price = await yahoo.getPrice(symbol)
        transaction.addStock(symbol, shares, price)
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async buyValue(symbol: string, value: number) {
        const transaction = Transaction.create(this.model.userId, 'buy')
        const price = await yahoo.getPrice(symbol)
        const shares = value / price
        transaction.addStock(symbol, shares, price)
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async sellAll() {
        const transaction = Transaction.create(this.model.userId, 'sell')
        await Promise.all(
            Array.from(this.model.portfolio.entries()).map(
                async ([symbol, stock]) => {
                    symbol = codec.decode(symbol)
                    const price = await yahoo.getPrice(symbol)
                    transaction.addStock(symbol, stock.shares, price)
                },
            ),
        )
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async sellStock(symbol: string) {
        const transaction = Transaction.create(this.model.userId, 'sell')
        const price = await yahoo.getPrice(symbol)
        const stock = this.model.portfolio.get(codec.encode(symbol))
        transaction.addStock(symbol, stock?.shares ?? 0, price)
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async sellShares(symbol: string, shares: number) {
        const transaction = Transaction.create(this.model.userId, 'sell')
        const price = await yahoo.getPrice(symbol)
        transaction.addStock(symbol, shares, price)
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async sellValue(symbol: string, value: number) {
        const transaction = Transaction.create(this.model.userId, 'sell')
        const price = await yahoo.getPrice(symbol)
        const shares = value / price
        transaction.addStock(symbol, shares, price)
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public async sellLast(count: number) {
        const transaction = Transaction.create(this.model.userId, 'sell')
        const stocks = Array.from(this.model.portfolio.keys()).slice(-count)
        await Promise.all(
            stocks.map(async (symbol) => {
                symbol = codec.decode(symbol)
                const price = await yahoo.getPrice(symbol)
                const stock = this.model.portfolio.get(codec.encode(symbol))
                transaction.addStock(symbol, stock?.shares ?? 0, price)
            }),
        )
        await this.executeTransaction(transaction.model)
        return transaction
    }

    public pay(target: ClientType, amount: number) {
        if (this.model.balance < amount) UserError.insufficientBalance()
        this.model.balance -= amount
        target.balance += amount
    }

    public addToWatchlist(symbol: string) {
        symbol = symbol.toUpperCase()
        if (this.model.watchlist.includes(symbol)) return
        this.model.watchlist.push(symbol)
    }

    public removeFromWatchlist(symbol: string) {
        symbol = symbol.toUpperCase()
        const index = this.model.watchlist.indexOf(symbol)
        if (index === -1) return
        this.model.watchlist.splice(index, 1)
    }

    public async getTotal() {
        const value = await this.getPortfolioValue()
        return this.model.balance + value
    }

    public async getProfit() {
        const total = await this.getTotal()
        return total - this.model.seed
    }

    public async getPortfolioValue() {
        const values = await Promise.all(
            this.getPortfolioStocks().map(async (symbol) => {
                const price = await yahoo.getPrice(symbol)
                const stock = this.getPortfolioStock(symbol)
                return stock.shares * price
            }),
        )
        return values.reduce((a, b) => a + b, 0)
    }

    public getPortfolioStock(symbol: string) {
        return (
            this.model.portfolio.get(codec.encode(symbol)) ?? {
                shares: 0,
                seed: 0,
            }
        )
    }

    public getPortfolioStocks() {
        return Array.from(this.model.portfolio.keys()).map(codec.decode)
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public async save() {
        return await this.model.save()
    }
}
