import { Server } from "http";
import app from "./app";
import config from "./config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let server: Server;

async function main() {
  try {
    await prisma.$connect();
    console.log("🟢 Connected to DB");

    server = app.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
    });

    // handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("🔥 Unhandled Rejection:", err);
      shutdown();
    });

    // handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("🔥 Uncaught Exception:", err);
      shutdown();
    });

    // graceful shutdown
    process.on("SIGTERM", () => {
      console.log("📴 SIGTERM received");
      shutdown();
    });

    process.on("SIGINT", () => {
      console.log("📴 SIGINT received");
      shutdown();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("🧹 Cleaning up...");

  if (server) {
    server.close(() => {
      console.log("🛑 Server closed");
    });
  }

  await prisma.$disconnect();
  process.exit(1);
}

main();
