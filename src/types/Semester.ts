import { Course } from "./Course.js";

export interface Semester {
    name: string,
    index: number,
    courses: Course[]
}