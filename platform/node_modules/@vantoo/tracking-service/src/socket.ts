import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { TrackingPayload } from "./services/tracking.service.js";

let io: Server | null = null;

export function initTrackingSocket(server: HttpServer, corsOrigins: string[]) {
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("join-order", (orderId: string) => {
      if (typeof orderId === "string" && orderId.length > 0) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on("join-admin", () => {
      socket.join("admin:live-map");
    });
  });

  return io;
}

export function emitRiderLocation(payload: TrackingPayload) {
  if (!io) return;

  const message = {
    orderId: payload.orderId,
    lat: payload.latitude,
    lng: payload.longitude,
    speed: payload.speed,
    heading: payload.heading,
    timestamp: payload.updatedAt,
    riderName: payload.riderName,
    riderPhone: payload.riderPhone,
    riderRating: payload.riderRating,
    etaMinutes: payload.etaMinutes,
    distanceKm: payload.distanceKm,
    distanceRemainingM: payload.distanceRemainingM,
  };

  io.to(`order:${payload.orderId}`).emit("rider-location", message);
  io.to("admin:live-map").emit("rider-location", message);
  io.to("admin:live-map").emit("user-location", {
    userId: payload.riderId,
    role: "rider",
    latitude: payload.latitude,
    longitude: payload.longitude,
    speed: payload.speed,
    heading: payload.heading,
    orderId: payload.orderId,
    updatedAt: payload.updatedAt,
    timestamp: payload.updatedAt,
    online: true,
  });
}
