import { Schedule } from "./Schedule.js";

export interface LoginInfo {
    username: string,
    currentSchedule: Schedule,
    savedSchedules: Schedule[]
}

export interface UseLoginInfoStore {
    loginInfo: LoginInfo,
    setLoginInfo: (updatedLoginInfo: LoginInfo) => void
}