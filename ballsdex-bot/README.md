# BallsDex Discord Bot

[![Discord server](https://img.shields.io/discord/1049118743101452329?color=7489d5&logo=discord&logoColor=ffffff)](https://discord.gg/Qn2Rkdkxwc)
[![Pre-commit](https://github.com/Ballsdex-Team/BallsDex-DiscordBot/actions/workflows/pre-commit.yml/badge.svg)](https://github.com/Ballsdex-Team/BallsDex-DiscordBot/actions/workflows/pre-commit.yml)
[![Issues](https://img.shields.io/github/issues/Ballsdex-Team/BallsDex-DiscordBot)](https://github.com/Ballsdex-Team/BallsDex-DiscordBot/issues)
[![discord.py](https://img.shields.io/badge/discord-py-blue.svg)](https://github.com/Rapptz/discord.py)
[![Black coding style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/ambv/black)
[![Patreon](https://img.shields.io/badge/Patreon-donate-orange.svg)](https://patreon.com/retke)

BallsDex is a bot for collecting countryballs on Discord and exchange them with your friends!

You can invite the official bot [here](https://discord.com/api/oauth2/authorize?client_id=999736048596816014&permissions=537193536&scope=bot%20applications.commands).

## Discord server

For help installing the bot, questions, suggestions to improve or contributions, feel free to join the official community of developers and self-hosters!

[![Discord server](https://discord.com/api/guilds/1255250024741212262/embed.png?style=banner3)](https://discord.gg/PKKhee4fvy)

> You can also find the server of our official Ballsdex bot here:
> 
> [![Discord server](https://discord.com/api/guilds/1049118743101452329/embed.png?style=banner2)](https://discord.gg/Qn2Rkdkxwc)

## Suggestions, issues and bug reports

Any bugs, suggestions or issues can be raised by creating an issue on this repo.

## Documentation

You can learn how to setup Ballsdex and use all of its tools on the
[wiki](https://wiki.ballsdex.com)!
More sections are added progressively.

## F1 Dex quick start

The imported F1 Dex setup uses the normal BallsDex spawning system:

1. Invite the bot with permission to read messages, send messages, embed links,
   and attach files.
2. In the server, run `/config channel` in the channel where cards should
   appear. If you run it in a different channel, pass the target channel as the
   command argument.
3. Press **Accept** on the activation message. After that, normal human
   messages build spawn progress and the bot posts a random enabled driver with
   a **Catch me!** button. The first spawn is intentionally delayed by the
   normal cooldown and the message-activity threshold.
4. Use `/config status` to check the selected channel, enabled state, and
   permissions. Use `/config disable` to pause or resume spawning.

### Adding a driver card

Cards are stored in the database as `Ball` records. A driver needs both image
files: a spawn image (`wild_card`) and a collection image
(`collection_card`).

For an owner or administrator with the required model permission, the quickest
Discord method is:

```text
/drivers create
```

Attach the spawn image and collection image, then fill in the driver name,
health, attack, rarity, emoji ID, credits, ability name, ability description,
and regime. Set `enabled` to `yes` for the driver to be eligible for automatic
spawns. The emoji must exist in a server or application emoji collection the
bot can access.

The Django admin panel can also be used to add or edit cards. Open the
configured admin site, choose **Ball**, and fill in the same fields under
**Assets**, including both image uploads. After saving, run the owner command
`reloadcache` (or restart the bot) so the new card is available to spawning.

If a card should be collectible but not appear automatically, save it with
`enabled` set to `no`; it can still be used by administrative spawn commands.

## Supporting

If you appreciate my work, you can support me on my [Patreon](https://patreon.com/retke)!

## Contributing

Take a look at [the contribution guide](CONTRIBUTING.md) for setting up your environment!

## License

This repository is released under the [MIT license](https://opensource.org/licenses/MIT).

If distributing this bot, credits to the original authors must not be removed.
