import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocket() {
  socket ??= io({
    withCredentials: true,
    autoConnect: false,
  });

  return socket;
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { getSocket, disconnectSocket };
