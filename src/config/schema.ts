import { pgTable, serial, text, integer, uuid } from "drizzle-orm/pg-core";

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

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    userSub: text("user_sub").unique()
});

export const schedules = pgTable('schedules', {
    id: serial('id').primaryKey(),
    scheduleName: text("schedule_name"),
    totalCredits: integer("total_credits"),
    userId: uuid('user_id').notNull().references(() => users.id),
    studentInfoId: uuid('studentinfo_id').notNull().references(() => studentInfo.id)
});

export const studentInfo = pgTable('studentInfo', {
    id: serial('id').primaryKey(),
    gradYear: integer('grad_year').notNull(),
    currYear: integer('curr_year').notNull(),
    interests: text('interests'),
    majorId: uuid('major_id').notNull().references(() => majors.id),
    minorId: uuid('minor_id').notNull().references(() => minors.id)
});