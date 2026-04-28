import { pgTable, serial, text, integer, uuid, primaryKey } from "drizzle-orm/pg-core";

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
    userId: integer('user_id').notNull().references(() => users.id),
    studentInfoId: integer('studentinfo_id').notNull().references(() => studentInfo.id)
});

export const studentInfo = pgTable('studentinfo', {
    id: serial('id').primaryKey(),
    gradYear: integer('grad_year').notNull(),
    interests: text('interests'),
    program: text('program'),
    majorId: integer('major_id').notNull().references(() => majors.id),
    minorId: integer('minor_id').references(() => minors.id)
});

export const semesters = pgTable('semesters', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    index: integer('index'),
    scheduleId: integer('schedule_id').notNull().references(() => schedules.id)
});

export const semesterCourses = pgTable('semester_courses', {
    semesterId: integer('semester_id').notNull().references(() => semesters.id),
    courseId: integer('course_id').notNull().references(() => courses.id),
}, (t) => [
    primaryKey({ columns: [t.semesterId, t.courseId] }) // config callback, define table level constraints
]);

export const coursePrerequisites = pgTable('course_prerequisites', {
    courseId: integer('course_id').notNull().references(() => courses.id),
    prerequisiteId: integer('prerequisite_id').notNull().references(() => courses.id),
}, (t) => [
    primaryKey({ columns: [t.courseId, t.prerequisiteId] })
]);

export const majorRequirements = pgTable('major_requirements', {
    majorId: integer('major_id').notNull().references(() => majors.id),
    courseId: integer('course_id').notNull().references(() => courses.id),
    yearIndex: integer('year_index').notNull(),
    semesterIndex: integer('semester_index').notNull()
}, (t) => [
    primaryKey({ columns: [t.majorId, t.courseId] })
]);

export const minorRequirements = pgTable('minor_requirements', {
    minorId: integer('minor_id').notNull().references(() => minors.id),
    courseId: integer('course_id').notNull().references(() => courses.id),
    yearIndex: integer('year_index').notNull(),
    semesterIndex: integer('semester_index').notNull()
}, (t) => [
    primaryKey({ columns: [t.minorId, t.courseId] })
]);