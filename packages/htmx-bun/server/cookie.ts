import crypto from "node:crypto";
import { warn } from "../lib/log";

const cookieSecret = process.env.COOKIE_SECRET;

if (!cookieSecret) {
    warn(
        "cookie",
        "No COOKIE_SECRET environment variable set.  Cookie will not be encrypted.",
    );
}

export type Cookie = Record<string, unknown>;

export async function writeCookie(response: Response, cookie: Cookie) {
    let value = JSON.stringify(cookie);
    if (cookieSecret) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", cookieSecret, iv);
        const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
        value = `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    }
    value = `mx=${value}; Path=/; HttpOnly; SameSite=Strict;`;
    response.headers.append("Set-Cookie", value);
}

export function readCookie(request: Request) {
    const value = (
        request.headers
            .get("Cookie")
            ?.split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("mx=")) ?? "mx={}"
    ).split("=")[1];
    if (value[0] === "{") {
        return JSON.parse(value) as Cookie;
    }
    if (!cookieSecret) {
        return {} as Cookie;
    }
    const [iv, encrypted] = value
        .split(":")
        .map((it) => Buffer.from(it, "hex"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", cookieSecret, iv);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return JSON.parse(decrypted.toString()) as Cookie;
}
