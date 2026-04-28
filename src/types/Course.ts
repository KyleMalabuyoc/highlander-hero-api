export type CourseType = 'cs-core' | 'math-core' | 'english-core' | 'seminar' | 'elective' | 'gen-ed' | 'lab';

export interface Course {
    id: number,
    name: string,
    code: number,
    description: string,
    credits: number,
    status: string,
    prerequisites: Course[],
    type: string,
    jobRelevancy?: string // build this response on the API side
}