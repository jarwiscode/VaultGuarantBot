"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUserToken = signUserToken;
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function signUserToken(userId) {
    const secret = config_1.config.botToken || "dev-secret";
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: "7d" });
}
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "NO_TOKEN" });
    }
    const token = header.slice("Bearer ".length);
    try {
        const secret = config_1.config.botToken || "dev-secret";
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.userId = decoded.userId;
        next();
    }
    catch {
        return res.status(401).json({ error: "INVALID_TOKEN" });
    }
}
function adminMiddleware(req, res, next) {
    const token = req.headers["x-admin-token"];
    if (!token || token !== config_1.config.adminToken) {
        return res.status(401).json({ error: "ADMIN_UNAUTHORIZED" });
    }
    next();
}
