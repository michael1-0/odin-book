import type { Server as HttpServer } from "node:http";
import { Server as SocketServer, type DefaultEventsMap } from "socket.io";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import env from "../config/env.ts";
import { AUTH_COOKIE_NAME } from "../constants/auth.ts";
import { findUserByJwtPayload } from "../utils/jwtUser.ts";

type SocketData = { userId: number };
type AppSocketServer = SocketServer<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

let io: AppSocketServer | null = null;

function userRoom(userId: number) {
  return `user:${userId}`;
}

async function getUserIdFromCookieHeader(cookieHeader: string) {
  const token = parseCookie(cookieHeader)[AUTH_COOKIE_NAME];

  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = jwt.verify(token, env.jwtSecret);

  if (typeof payload === "string") {
    throw new Error("Unauthorized");
  }

  const user = await findUserByJwtPayload(payload);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}

function initSocketServer(httpServer: HttpServer) {
  io = new SocketServer<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    SocketData
  >(httpServer, {
    path: "/socket.io",
  });

  io.use((socket, next) => {
    getUserIdFromCookieHeader(socket.handshake.headers.cookie ?? "").then(
      (userId) => {
        socket.data.userId = userId;
        next();
      },
      () => next(new Error("Unauthorized")),
    );
  });

  io.on("connection", (socket) => {
    void socket.join(userRoom(socket.data.userId));
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error("Socket.io server has not been initialized");
  }

  return io;
}

function emitToUser(userId: number, event: string, payload: unknown) {
  getIo().to(userRoom(userId)).emit(event, payload);
}

export { initSocketServer, getIo, userRoom, emitToUser };
