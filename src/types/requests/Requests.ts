import { StudentInfo } from "../StudentInfo.js";

export interface NewScheduleRequest {
    scheduleName: string,
    studentInfo: StudentInfo;
}

export interface UpdateScheduleRequest {
    semesterId: number,
    originalCourseIds: number[],
    updatedCourseIds: number[]
}