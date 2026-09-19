import http from "node:http";
import app from "./app.ts";
import { initSocketServer } from "./socket/io.ts";
import env from "./config/env.ts";

const PORT = env.port;

const httpServer = http.createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
