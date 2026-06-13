import { db } from "../config/db.js";
import { formatMsg, logger } from "../config/logger/pino.js";
import redis from "../config/redis.js"
import { users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { USER_REPO_METHODS, USER_REPOSITORY } from "../types/Logging.js";

export const getUserId = async (sub: string | undefined, username: string | undefined): Promise<number> => {

    // check cache
    // if not present, query for it, store in cache, return it

    try {

        const cache = await redis.get<number>(`userid:${username}`);

        if(cache !== null) {
            return cache; // cache hit
        }
     
    } catch(err) {
        logger.error({ ...formatMsg(USER_REPOSITORY, USER_REPO_METHODS.GET_USER_ID), err }, 'Error retrieving userid from cache.');
    }

    try {

        // cache miss
        const userid = await db.select({ "id": users.id }).from(users).where(eq(users.userSub, `${sub}`));

        if (userid.length > 0 && userid[0].id != null) {
            await redis.set(`userid:${username}`, userid[0].id);
        }

        return userid[0].id;

    } catch(err) {
        logger.error({ ...formatMsg(USER_REPOSITORY, USER_REPO_METHODS.GET_USER_ID), err }, 'Error retrieving userid from DB.');
        return -1;
    }

}  