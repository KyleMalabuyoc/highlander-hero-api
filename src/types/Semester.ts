import { Course } from "./Course.js";

export interface Semester {
    name: string,
    index: number,
    yearIndex?: number, // need this property here so LLM knows where to add newfound / swapped courses
    courses: Course[]
}