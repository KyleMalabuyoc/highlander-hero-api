import { Course } from "./Course.js";

export interface StudentInfo {
    major: string,
    minor: string,
    graduationYear: number,
    currentYear: string,
    interests: Course[],
    transfer: boolean,
    currentCredits: number
}

export interface UseStudentInfoStore {
    studentInfo: StudentInfo,
    setStudentInfo: (updatedStudentInfo: StudentInfo) => void
} 