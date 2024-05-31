import { HydratedDocument } from 'mongoose'

import ranks from '@/data/ranks'
import UserError from '@/errors/user'
import random from '@/libs/random'
import { ClientType } from '@/models/client'
import { WarType, WarModel } from '@/models/war'

export default class War {
    public constructor(public model: HydratedDocument<WarType>) {}

    public static async findById(id: string) {
        const war = await WarModel.findById(id)
        if (!war) throw new Error('War not found')
        return new War(war)
    }

    public static create(
        userId: WarType['userId'],
        bet: WarType['bet'],
        tieBet: WarType['tieBet'],
    ) {
        const model = new WarModel({
            userId,
            bet,
            tieBet,
        })
        return new War(model)
    }

    public initialize(self: ClientType, client: ClientType) {
        const { playerCard, dealerCard } = this.pushCards()
        this.modifyDelta(self, client, -(this.model.bet + this.model.tieBet))
        const playerRank = parseRank(playerCard.rank)
        const dealerRank = parseRank(dealerCard.rank)
        if (playerRank > dealerRank) {
            this.model.winner = 'player'
            this.modifyDelta(self, client, this.model.bet * 2)
        } else if (playerRank < dealerRank) {
            this.model.winner = 'dealer'
        } else {
            this.model.winner = 'none'
            this.modifyDelta(self, client, this.model.tieBet * 11)
        }
    }

    public surrender(self: ClientType, client: ClientType) {
        if (this.model.winner !== 'none' || this.model.action !== 'tbd') return
        this.model.action = 'surrender'
        this.model.winner = 'dealer'
        this.modifyDelta(self, client, this.model.bet / 2)
    }

    public war(self: ClientType, client: ClientType) {
        if (this.model.winner !== 'none' || this.model.action !== 'tbd') return
        this.model.action = 'war'
        this.modifyDelta(self, client, -this.model.bet)
        const { playerCard, dealerCard } = this.pushCards()
        const playerRank = parseRank(playerCard.rank)
        const dealerRank = parseRank(dealerCard.rank)
        if (playerRank > dealerRank) {
            this.model.winner = 'player'
            this.modifyDelta(self, client, this.model.bet * 3)
        } else if (playerRank < dealerRank) {
            this.model.winner = 'dealer'
        } else {
            this.model.winner = 'none'
            this.modifyDelta(self, client, this.model.bet * 4)
        }
    }

    public pushCards() {
        const playerCard = random.card()
        const dealerCard = random.card()
        this.model.playerCards.push(playerCard)
        this.model.dealerCards.push(dealerCard)
        return { playerCard, dealerCard }
    }

    public modifyDelta(self: ClientType, client: ClientType, delta: number) {
        if (delta < 0 && Math.abs(delta) > client.balance)
            UserError.insufficientBalance()
        this.model.delta += delta
        client.balance += delta
        self.balance -= delta
    }

    public getId() {
        return this.model._id.toHexString()
    }

    public async save() {
        await this.model.save()
    }
}

const rankValues: Record<(typeof ranks)[number], number> = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14,
}

function parseRank(rank: keyof typeof rankValues) {
    return rankValues[rank]
}
