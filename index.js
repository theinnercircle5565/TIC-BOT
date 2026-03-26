const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

// 🔑 PUT YOUR DATA HERE
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1480570358192013443";

// 🧠 Temporary warn storage
const warns = new Map();

// 📢 Auto announcer storage
const autoAnnouncements = new Map();

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ================= SLASH COMMANDS =================
const commands = [

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member")
    .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true)),

  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Show info about a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(false)),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show avatar of a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(false)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member")
    .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban by user ID")
    .addStringOption(o => o.setName("id").setDescription("User ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Time in minutes").setRequired(true)),

  new SlashCommandBuilder()
    .setName("remove_timeout")
    .setDescription("Remove timeout")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("remove_warn")
    .setDescription("Remove a warn")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true)),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("👑 GOD MODE announcement")
    .addChannelOption(o => o.setName("channel").setDescription("Where to send").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("Text").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete messages")
    .addIntegerOption(o => o.setName("amount").setDescription("Number").setRequired(true)),

  // 👑 AUTO ANNOUNCER COMMANDS
  new SlashCommandBuilder()
    .setName("announce_start")
    .setDescription("📢 Start auto announcement")
    .addChannelOption(o =>
      o.setName("channel").setDescription("Channel").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes").setDescription("Interval (minutes)").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message").setDescription("Message").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce_stop")
    .setDescription("🛑 Stop auto announcement"),

].map(c => c.toJSON());

// ================= REGISTER COMMANDS =================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log("⚡ Slash commands registered");
})();

// ================= READY =================
client.once("clientReady", () => {
  console.log(`🌌 BOT ONLINE (${client.user.tag})`);
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  const member = i.member;

  // ===== INFO =====
  if (i.commandName === "info") {
    const user = i.options.getUser("user") || i.user;
    const m = await i.guild.members.fetch(user.id);

    return i.reply({
      embeds: [{
        color: 0x5865f2,
        title: `👤 ${m.displayName}`,
        thumbnail: { url: user.displayAvatarURL() },
        fields: [
          { name: "Username", value: user.tag, inline: true },
          { name: "User ID", value: user.id }
        ]
      }]
    });
  }

  // ===== AVATAR =====
  if (i.commandName === "avatar") {
    const user = i.options.getUser("user") || i.user;
    return i.reply({
      embeds: [{
        color: 0x5865f2,
        title: user.tag,
        image: { url: user.displayAvatarURL({ size: 1024 }) }
      }]
    });
  }

  // ===== GOD ANNOUNCE =====
  if (i.commandName === "announce") {
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply({ content: "❌ Admin only", ephemeral: true });

    const ch = i.options.getChannel("channel");
    const msg = i.options.getString("message");

    await ch.send({
      embeds: [{ color: 0xd8a8ff, title: "🌑 SERVER ANNOUNCEMENT, description: msg }]
    });

    return i.reply({ content: "👑 Sent!", ephemeral: true });
  }

  // ================= AUTO ANNOUNCER PRO =================

  if (i.commandName === "announce_start") {

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply({ content: "❌ Admin only", ephemeral: true });

    const ch = i.options.getChannel("channel");
    const mins = i.options.getInteger("minutes");
    const msg = i.options.getString("message");

    const interval = mins * 60 * 1000;

    if (autoAnnouncements.has(i.guild.id))
      clearInterval(autoAnnouncements.get(i.guild.id));

    const timer = setInterval(() => {
      ch.send({
        embeds: [{
          color: 0xd8a8ff,
          title: "✦ ANNOUNCEMENT ✦",
          description: msg,
          timestamp: new Date()
        }]
      });
    }, interval);

    autoAnnouncements.set(i.guild.id, timer);

    return i.reply({
      content: `👑 Started every ${mins} min in ${ch}`,
      ephemeral: true
    });
  }

  if (i.commandName === "announce_stop") {

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
      return i.reply({ content: "❌ Admin only", ephemeral: true });

    const timer = autoAnnouncements.get(i.guild.id);
    if (!timer)
      return i.reply({ content: "⚠️ Nothing running", ephemeral: true });

    clearInterval(timer);
    autoAnnouncements.delete(i.guild.id);

    return i.reply({ content: "🛑 Stopped", ephemeral: true });
  }

  // ================= MOD COMMANDS =================

  if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
    return;

  const user = i.options.getUser("user");
  const target = user ? await i.guild.members.fetch(user.id) : null;

  try {

    if (i.commandName === "kick") {
      await target.kick();
      return i.reply(`👢 Kicked ${user.tag}`);
    }

    if (i.commandName === "ban") {
      await target.ban();
      return i.reply(`🔨 Banned ${user.tag}`);
    }

    if (i.commandName === "clear") {
      const amt = i.options.getInteger("amount");
      await i.channel.bulkDelete(amt, true);
      return i.reply({ content: `🧹 Deleted ${amt}`, ephemeral: true });
    }

  } catch (err) {
    console.error(err);
  }

});

// ================= AUTO REPLIES =================
client.on("messageCreate", message => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === "hello") {
    message.reply(`👋 Hello ${message.author.username}!`);
  }
});

// ================= LOGIN =================
client.login(TOKEN);
