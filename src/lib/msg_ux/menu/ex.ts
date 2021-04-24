
// API Usage.

enum PageErrors {
  TimeOut,
  Perms,
}

interface State {
  userIsAutism: boolean;
  someData?: string;
}

// State is optional here, as the onFinish function doesn't use ctx.state
// (so if I didn't supply the state generic, could use the default state which is {})
// but I'm supplying it as a generic anyway for the sake of demonstration.
const oneMinPageTimer = timer<State>(60 * 1000, ctx =>
  ctx.reject(PageErrors.TimeOut)
);

const autismPage = compose<State>(
  embed({ title: "bro are u sure u are autism" }),
  oneMinPageTimer,
  button("✅", ctx => ctx.resolve(true)),
  button("❌", ctx => ctx.resolve(false))
);

// function composer<S>(...): Promise<{ ctx: Context<S>, result: ... }>
compose<State>(
  embed({ title: "do you agree" }),
  oneMinPageTimer,
  button("✅", async ctx => {
    ctx.state.someData = "whatever";
    // ctx.finish resolves the promise so that the menu continues below.
    await ctx.resolve(true);
    // Maybe I want to do something after the menu is done, but in the context of the check button?
    // Just await the resolve function and do that thing afterwards.
  }),
  button("❌", ctx => ctx.finish(false)),
  button("♿", async ctx => {
    // This is how we would change page.
    // The page should return a boolean.
    // If the page throws an error, we don't have to handle it
    // because it will rise to the top of the error chain anyway
    // and thus be handled by the catch that is below.
    const res = await ctx.child(autismPage);
    ctx.state.userIsAutism = res;
  })
)
  // (msg: Message, initialState: S)
  .run(msg, { userIsAutist: true })
  .catch(({ ctx, error }) => {
    console.error("Wtf autism?!", error);
  })
  .then(async ({ ctx, result }) => {
    // They went to autism page.
    if (typeof result === "undefined") {
      const user = await db.user(msg.author.id);
      user.isAutist = ctx.state.userIsAutism;
      await db.push(user);
    } else if (result) {
      console.log("true!");
    } else {
      console.log("no bro");
    }
  });
