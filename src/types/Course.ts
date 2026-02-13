export type CourseType = 'cs-core' | 'math-core' | 'english-core' | 'seminar' | 'elective' | 'gen-ed' | 'lab';

export interface Course {
    id: number,
    name: string,
    code: number,
    description: string,
    credits: number,
    status: 'complete' | 'in-progress' | 'failed' | 'n/a',
    prerequisites: Course[], // circular reference -> might want to have a list of ids here, resolve when needed
    type: CourseType,
    jobRelevancy?: string // build this response on the API side
}