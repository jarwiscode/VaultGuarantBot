"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTelegramInitData = verifyTelegramInitData;
exports.parseTelegramUser = parseTelegramUser;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("./config");
function verifyTelegramInitData(initData) {
    if (!initData) {
        return { ok: false, error: "EMPTY_INIT_DATA" };
    }
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get("hash");
    if (!hash) {
        return { ok: false, error: "NO_HASH" };
    }
    parsed.delete("hash");
    const dataCheckArray = [];
    parsed.sort();
    parsed.forEach((value, key) => {
        dataCheckArray.push(`${key}=${value}`);
    });
    const dataCheckString = dataCheckArray.join("\n");
    const secretKey = crypto_1.default
        .createHmac("sha256", "WebAppData")
        .update(config_1.config.botToken)
        .digest();
    const computedHash = crypto_1.default
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");
    if (computedHash !== hash) {
        return { ok: false, error: "HASH_MISMATCH" };
    }
    const data = {};
    parsed.forEach((value, key) => {
        data[key] = value;
    });
    return { ok: true, data };
}
function parseTelegramUser(data) {
    const rawUser = data.user;
    if (!rawUser) {
        throw new Error("NO_USER_IN_INIT_DATA");
    }
    const user = JSON.parse(rawUser);
    return {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        language_code: user.language_code,
    };
}
