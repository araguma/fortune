import { SlashCommandBuilder } from 'discord.js'
import he from 'he'
import Sentiment from 'sentiment'

import alpaca from '@/libs/alpaca'
import database from '@/libs/database'
import discord from '@/libs/discord'
import { UserError } from '@/libs/error'

const sentiment = new Sentiment()

discord.addCommand({
    descriptor: new SlashCommandBuilder()
        .setName('news')
        .setDescription('Get the latest news')
        .addStringOption((option) =>
            option
                .setName('symbol')
                .setDescription('Stock ticker')
                .setRequired(false),
        )
        .toJSON(),
    handler: async (interaction) => {
        const symbol = interaction.options.getString('symbol')
        const symbols = symbol
            ? [symbol.toUpperCase()]
            : await (async () => {
                  const symbols = new Set<string>()
                  const client = await database.getClientByUserId(
                      interaction.user.id,
                  )
                  const watchlist = await database
                      .getClientByUserId(interaction.user.id)
                      .then((client) => client.watchlist)
                  Array.from(client.portfolio.keys()).forEach((symbol) =>
                      symbols.add(symbol),
                  )
                  watchlist.forEach((symbol) => symbols.add(symbol))
                  return Array.from(symbols)
              })()

        const start = new Date()
        const end = new Date()
        start.setDate(start.getDate() - 7)
        const news = await alpaca.getNews(symbols, start, end)

        if (news.length === 0)
            UserError.throw('No news found for ' + symbols.join(', '))

        await interaction.reply({
            embeds: news.map((article) => {
                const score = sentiment.analyze(
                    article.headline + ' ' + article.summary,
                ).comparative
                return {
                    color:
                        score > 0 ? 0x2ecc71 : score < 0 ? 0xe74c3c : 0x3498db,
                    title: article.headline,
                    url: article.url ?? '',
                    description: he.decode(article.summary),
                    thumbnail: {
                        url: article.images[0]?.url ?? '',
                    },
                    fields: [
                        {
                            name: 'Sentiment',
                            value: score.toString(),
                            inline: true,
                        },
                        {
                            name: 'Symbols',
                            value: article.symbols.join(', '),
                            inline: true,
                        },
                    ],
                    footer: {
                        text: `${article.id}  •  ${article.source}`,
                    },
                    timestamp: new Date(article.updated_at).toISOString(),
                }
            }),
        })
    },
})
