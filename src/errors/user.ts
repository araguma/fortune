import { Group } from '@/enums'

export default class UserError extends Error {
    public constructor(message: string) {
        super(message)
        this.name = 'ClientError'
    }

    public static adminOnly(): never {
        throw new UserError('This command is only available to administrators')
    }

    public static guildOnly(): never {
        throw new UserError('This command is only available in servers')
    }

    public static notWhitelisted(channelId: string, group: Group): never {
        throw new UserError(
            `**<#${channelId}>** is not whitelisted for **${group}** commands`,
        )
    }

    public static invalidSymbol(symbol: string): never {
        throw new UserError(`Invalid symbol: ${symbol}`)
    }

    public static invalidCurrency(currency: string): never {
        throw new UserError(`Invalid currency: ${currency}`)
    }

    public static invalidUserId(userId: string): never {
        throw new UserError(`Invalid user ID: ${userId}`)
    }

    public static invalidOption(option: number): never {
        throw new UserError(`Invalid option: ${option}`)
    }

    public static invalidSubcommand(subcommand: string): never {
        throw new UserError(`Invalid subcommand: ${subcommand}`)
    }

    public static invalidType(type: string): never {
        throw new UserError(`Invalid type: ${type}`)
    }

    public static missingSymbol(): never {
        throw new UserError('Missing symbol')
    }

    public static noCurrency(symbol: string): never {
        throw new UserError(`No currency found for ${symbol}`)
    }

    public static noPrice(symbol: string): never {
        throw new UserError(`No price found for ${symbol}`)
    }

    public static noClaims(timeLeft: string): never {
        throw new UserError(`You can claim again in ${timeLeft}`)
    }

    public static notOwned(symbol: string): never {
        throw new UserError(`You do not own any ${symbol}`)
    }

    public static insufficientShares(symbol: string): never {
        throw new UserError(`Insufficient shares for ${symbol}`)
    }

    public static insufficientBalance(): never {
        throw new UserError('Insufficient balance')
    }

    public static insufficientBet(minimum: number): never {
        throw new UserError(`Minimum bet is ${minimum}`)
    }
}
