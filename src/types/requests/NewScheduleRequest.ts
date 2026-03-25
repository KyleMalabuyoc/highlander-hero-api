import { StudentInfo } from "../StudentInfo.js";


export interface NewScheduleRequest {
    scheduleName: string,
    studentInfo: StudentInfo;
}