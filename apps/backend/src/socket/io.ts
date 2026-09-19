import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.ts";

let io: SocketServer | null = null;

function userRoom(userId: number) {
  return `user:${userId}`;
}

function initSocketServer(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookie(socket.handshake.headers.cookie ?? "");
      const token = cookies["token"];

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret",
      ) as jwt.JwtPayload;
      const userId = Number(payload.sub);

      if (!Number.isInteger(userId)) {
        return next(new Error("Unauthorized"));
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId as number));
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error("Socket.io server has not been initialized");
  }

  return io;
}

export { initSocketServer, getIo, userRoom };
