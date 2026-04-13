import { z } from 'zod';

// AcademicProgram
export const AcademicProgramSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    reqCreds: z.number(),
});

export const MajorSchema = AcademicProgramSchema;
export const MinorSchema = AcademicProgramSchema;

// Course
export const CourseSchema = z.object({
    id: z.number(),
    name: z.string(),
    code: z.number(),
    description: z.string(),
    credits: z.number(),
    status: z.enum(['complete', 'in-progress', 'failed', 'n/a']),
    prerequisites: z.array(z.number()),
    type: z.enum(['cs-core', 'math-core', 'english-core', 'seminar', 'elective', 'gen-ed', 'lab']),
    jobRelevancy: z.string().nullable(),
});

// Semester
export const SemesterSchema = z.object({
    name: z.string(),
    index: z.number(),
    courses: z.array(CourseSchema),
});

// StudentInfo
export const StudentInfoSchema = z.object({
    major: MajorSchema,
    minor: MinorSchema.nullable(),
    graduationYear: z.number(),
    program: z.string(),
    interests: z.array(z.string()).nullable(),
});

// Schedule
export const ScheduleSchema = z.object({
    name: z.string(),
    semesters: z.array(SemesterSchema),
    studentInfo: StudentInfoSchema,
});

export const ScheduleLLMResponseSchema = z.object({
    name: z.string(),
    semesters: z.array(SemesterSchema)
});

// Suggestion / Edit
export const SuggestionSchema = z.object({
    id: z.uuid(),
    action: z.enum(['swap', 'add', 'remove']),
    reason: z.string(),
    status: z.enum(['pending', 'accepted', 'rejected']),
    originalCourse: CourseSchema.nullable(),
    proposedCourse: CourseSchema.nullable(),
});

export const EditScheduleLLMResponseSchema = z.object({
    role: z.literal('assistant'),
    content: z.string(),
    suggestions: z.array(SuggestionSchema)
});

export interface Suggestion {
    id: string;
    action: 'swap' | 'add' | 'remove';
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
    originalCourse: z.infer<typeof CourseSchema> | null;
    proposedCourse: z.infer<typeof CourseSchema> | null;
}

export type Schedule = z.infer<typeof ScheduleSchema>;
export type ScheduleLLMResponse = z.infer<typeof ScheduleLLMResponseSchema>;
export type EditScheduleLLMResponse = z.infer<typeof EditScheduleLLMResponseSchema>;
export type Semester = z.infer<typeof SemesterSchema>;
export type StudentInfo = z.infer<typeof StudentInfoSchema>;
