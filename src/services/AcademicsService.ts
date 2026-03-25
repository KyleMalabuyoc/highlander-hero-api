import { db } from "../config/db.js";
import { courses, majors, minors } from "../config/schema.js";
import { ResponseEntity } from "../types/ResponseEntity.js";

export const getCourses = async (): Promise<ResponseEntity> => {
    try {

        const res = await db.select().from(courses);
        return { status: 200, data: res };

    } catch(err) {
        if (err instanceof Error) {
            return { status: 500, errorMessage: err.message };
        }
        return { status: 500, errorMessage: "Internal Server Error" };
    }
}

export const getMajors = async (): Promise<ResponseEntity> => {
    try {

        const res = await db.select().from(majors);
        return { status: 200, data: res };

    } catch(err) {
        if (err instanceof Error) {
            return { status: 500, errorMessage: err.message };
        }
        return { status: 500, errorMessage: "Internal Server Error" };
    }
}

export const getMinors = async (): Promise<ResponseEntity> => {
    try {

        const res = await db.select().from(minors);
        return { status: 200, data: res };

    } catch(err) {
        if (err instanceof Error) {
            return { status: 500, errorMessage: err.message };
        }
        return { status: 500, errorMessage: "Internal Server Error" };
    }
}