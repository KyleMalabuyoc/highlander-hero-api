import { openai } from '../config/openai.js';
import { pinecone_index } from '../config/pinecone.js';
import { StudentInfo } from '../types/StudentInfo.js';
import { formatMsg, logger } from '../config/logger/pino.js';
import { PINECONE_SERVICE, PINECONE_METHODS } from '../types/Logging.js';

/**
 * 
 * Used to grab relevant course information on a students major (and minor if applicable) to be passed to LLM as context
 * 
 * @param studentInfo 
 * @returns array of pinecone metadata
 */
export const pineconeQueryForScheduleCreation = async (studentInfo: StudentInfo) => {

    let pineconeQueryPromises = [];

    // checking for major since its required
    if (studentInfo === null || studentInfo.major === null || studentInfo.major === undefined) {
        return [];
    }

    try {

        // grab pinecone stored information for major
        const majorEmbeddingPromise = openai.embeddings.create({
            model: "text-embedding-3-small",
            input: studentInfo.major.name,
            encoding_format: "float"
        });

        // chain embed promise to query promise
        const majorPineconeQuery = majorEmbeddingPromise.then((r) => {
            const query = pinecone_index.query({
                vector: r.data[0].embedding,
                topK: 1,
                includeMetadata: true
            });
            return query;
        });

        pineconeQueryPromises.push(majorPineconeQuery);

        // same idea for minor if applicable
        if (studentInfo.minor !== null && studentInfo.minor !== undefined) {
            const minorEmbeddingPromise = openai.embeddings.create({
                model: "text-embedding-3-small",
                input: studentInfo.minor.name,
                encoding_format: "float",
            });
            const minorPineconeQuery = minorEmbeddingPromise.then((r) => {
                const query = pinecone_index.query({
                    vector: r.data[0].embedding,
                    topK: 1,
                    includeMetadata: true
                });
                return query;
            });
            pineconeQueryPromises.push(minorPineconeQuery);
        }

        const pineconeResults = await Promise.all(pineconeQueryPromises);

        logger.info(formatMsg(PINECONE_SERVICE, PINECONE_METHODS.QUERY_FOR_SCHEDULE_CREATION), "Executed pinecone query call to grab metadata on major (and minor if applicable).");

        return pineconeResults;

    } catch(e) {
        logger.error({ ...formatMsg(PINECONE_SERVICE, PINECONE_METHODS.QUERY_FOR_SCHEDULE_CREATION), err: e }, 'Pinecone query error.');
        return [];
    }
}

export const simplePineconeCall = async (query: string, topK: number = 1) => {

    try {

        const userQueryEmbedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
            encoding_format: "float",
        });

        const pineconeMetadata = await pinecone_index.query({
            vector: userQueryEmbedding.data[0].embedding,
            topK: topK,
            includeMetadata: true
        });

        logger.info(formatMsg(PINECONE_SERVICE, PINECONE_METHODS.SIMPLE_PINECONE_CALL), "Executed pinecone simple query to grab context on major / minor.");

        return pineconeMetadata;

    } catch(e) {
        logger.error({ ...formatMsg(PINECONE_SERVICE, PINECONE_METHODS.SIMPLE_PINECONE_CALL), err: e }, 'Pinecone query error.');
        throw e;
    }

}