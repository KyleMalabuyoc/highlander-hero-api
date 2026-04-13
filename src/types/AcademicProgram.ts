export interface AcademicProgram {
    id: number,
    name: string,
    description: string,
    reqCreds: number
}

export interface Major extends AcademicProgram {}

export interface Minor extends AcademicProgram {}