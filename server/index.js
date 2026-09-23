import "dotenv/config";

import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, "0.0.0.0", () => {
  console.log(`Gayatri portfolio assistant listening on http://localhost:${port}`);
});
