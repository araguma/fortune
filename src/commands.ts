import '@/commands/actives'
import '@/commands/blackjack'
import '@/commands/buy'
import '@/commands/claim'
import '@/commands/leaderboard'
import '@/commands/movers'
import '@/commands/pay'
import '@/commands/portfolio'
import '@/commands/prediction'
import '@/commands/sell'
import '@/commands/view'
import '@/commands/war'
import '@/commands/watchlist'
import '@/commands/whitelist'
import log from '@/libs/log'
import discord from '@/services/discord'

discord.on('ready', () => {
    void discord.registerCommands().then((commands) => {
        log.success(`Registered ${commands.length} commands`)
    })
})
