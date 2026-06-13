import { Major, Minor } from "./AcademicProgram.js";

export interface StudentInfo {
    major: Major,
    minor: Minor,
    graduationYear: number,
    program: string, // undergraduate, masters
    interests: string[]
}

export interface UseStudentInfoStore {
    studentInfo: StudentInfo,
    setStudentInfo: (updatedStudentInfo: StudentInfo) => void
}