import { StudentInfo } from "./StudentInfo.js";

export interface RegisterInfo extends StudentInfo {
    email: string;
    password: string;
}