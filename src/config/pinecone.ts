import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone client
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY ?? "" });
export const pinecone_index = pinecone.index({ name: process.env.PINECONE_INDEX_NAME });

