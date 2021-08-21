
Plugin.addCommand(cmd =>
  cmd
    .setName("name")
    .setDescription("it does something")
    .isDefaultPermissionsEnabled(true)
    .addStringOption(opt =>
      opt.setName("input").isRequired(true).setDescription("Enter a string")
    )
    .addIntegerOption(opt =>
      opt.setName("int").setDescription("Enter an integer")
    )
    .addNumberOption(opt => opt.setName("num").setDescription("Enter a number"))
    .addBooleanOption(opt =>
      opt.setName("choice").setDescription("Select a boolean")
    )
    .addUserOption(opt => opt.setName("target").setDescription("Select a user"))
    .addChannelOption(opt =>
      opt.setName("destination").setDescription("Select a channel")
    )
    .addRoleOption(opt => opt.setName("muted").setDescription("Select a role"))
    .addMentionableOption(opt =>
      opt.setName("mentionable").setDescription("Mention something")
    )
    .use(ctx => {
      ctx.args.input; // string
      ctx.args.int; // number | undefined
    })
);
