import { openai } from '../config/openai.js';
import { pinecone_index } from '../config/pinecone.js';
import { StudentInfo } from '../types/StudentInfo.js';

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
            encoding_format: "float",
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

        return pineconeResults;

    } catch(e) {
        console.error(e);
        return [];
    }
}

export const simplePineconeCall = async (query: string, topK: number = 1) => {

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

    return pineconeMetadata;

}