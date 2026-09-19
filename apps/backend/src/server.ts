import http from "node:http";
import app from "./app.ts";
import { initSocketServer } from "./socket/io.ts";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
