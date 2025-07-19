"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.$connect();
            console.log("🟢 Connected to DB");
            server = app_1.default.listen(config_1.default.port, () => {
                console.log(`🚀 Server is running on http://localhost:${config_1.default.port}`);
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
        }
        catch (error) {
            console.error("❌ Failed to start server:", error);
            process.exit(1);
        }
    });
}
function shutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🧹 Cleaning up...");
        if (server) {
            server.close(() => {
                console.log("🛑 Server closed");
            });
        }
        yield prisma.$disconnect();
        process.exit(1);
    });
}
main();
