type EventNames = "messageCreate" | "interactionCreate";

type Runner = (...args: any[]) => Promise<void> | void;

class Event<N extends EventNames, R extends Runner = Runner> {
  #runner!: R;

  constructor(public readonly name: N) {}

  addRunner<AR extends Runner>(runner: AR) {
    this.#runner = runner as unknown as R;
    return this as unknown as Event<N, AR>;
  }

  execute(...args: Parameters<R>) {
    if (typeof this.#runner === "undefined") {
      throw new Error("No runner specified");
    }

    return this.#runner(...args);
  }
}

const ev = new Event("messageCreate").addRunner((thing: string) => {
  // do something.
  console.log(thing);
});

// the type of ev is Event<"messageCreate", (thing: string) => void>
