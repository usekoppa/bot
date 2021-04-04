export async function bootstrap() {
  await loadComponents();
}

async function loadComponents() {
  void (await Promise.all(
    ["@lib/commands/msg_handler", "./info", "./bot"].map(comp => import(comp))
  ));
}
