import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const majors = pgTable('majors', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    reqCreds: integer("req_credits").notNull()
});

export const minors = pgTable('minors', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    reqCreds: integer("req_credits").notNull()
});

export const courses = pgTable('courses', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    code: integer('code').notNull(),
    description: text('description').notNull(),
    credits: integer("credits").notNull(),
    status: text('status').notNull(),
    type: text('type').notNull(),
    jobRelevancy: text('job_relevancy').notNull()
});