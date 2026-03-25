import { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../config/db.js";
import redis from "../config/redis.js"
import { users } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const getUserId = async (sub: string | undefined, username: string | undefined) => {

    // check cache
    // if not present, query for it, store in cache, return it

    try {

        const cache = await redis.get<number>(`userid:${username}`);

        if(cache !== null) {
            return cache; // cache hit
        }
     
    } catch(e) {
        console.error(e);
    }

    try {

        // cache miss
        const userid = await db.select({ "id": users.id }).from(users).where(eq(users.userSub, `${sub}`));

        if (userid.length > 0 && userid[0].id != null) {
            await redis.set(`userid:${username}`, userid[0].id);
        }

        return userid[0].id;

    } catch(e) {
        console.error(e);
    }

}  