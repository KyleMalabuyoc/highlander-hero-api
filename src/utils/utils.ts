import redis from "../config/redis.js";

export const ratelimiter = async (ip: string, limit: number, windowMs: number) => {

    const now = Date.now();
    const start = Date.now() - windowMs;
    const key = `ratelimit:${ip}`;

    // atomic operation to remove the timestamps that dont fall in this window
    await redis.zremrangebyscore(key, 0, start);

    const count = await redis.zcard(key);

    // limit is hit, dont allow through
    if (count >= limit) {
        return false;
    }

    await redis.zadd(key, { score: now, member: now.toString() });

    // set TTL to be the full window time
    await redis.expire(key, windowMs / 1000);

    return true;
}

export const ipValidation = (ip: string) => {

    // check for private IPs
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.') || ip === '::1' ||ip === '127.0.0.1') {
        return false;
    }
        
    return true;

}