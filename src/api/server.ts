import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4310);
const app = createApp();

app.listen(port, () => {
  console.log(`Sesamath Manuel API: http://localhost:${port}`);
  console.log("CLI rapide: npm run sesa -- ex 60 p256 --open");
});
