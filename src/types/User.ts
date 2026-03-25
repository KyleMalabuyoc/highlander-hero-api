import { Schedule } from "./Schedule.js";

export interface User {
    username: string;
    schedules: Schedule[]
}