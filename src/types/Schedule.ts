import { Semester } from "./Semester.js";
import { StudentInfo } from "./StudentInfo.js";

export interface Schedule {
    name: string,
    semesters: Semester[],
    studentInfo: StudentInfo
}

export interface UseScheduleStore {
    currentSchedule: Schedule,
    savedSchedules: Schedule[],
    setSchedule: (updatedSchedule: Schedule) => void,
    setSavedSchedules: (updatedSchedules: Schedule[]) => void
}
