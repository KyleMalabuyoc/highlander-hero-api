import { ChatCompletionTool } from "openai/resources";
import { inArray } from "drizzle-orm";
import { db } from "../../config/db.js";
import { courses } from "../../config/schema.js";

// tool used for our LLM to make DB calls
export const get_course_tool: ChatCompletionTool[] = [{
    type: "function",
    function: {
        name: "get_courses",
        description: "Grab specific course information to build a users degree schedule based off of their major, minor graduation year, and interests.",
        parameters: {
            type: "object",
            properties: {
                courses: {
                    type: "array",
                    description: "List of courses to look up.",
                    items: {
                        type: "string",
                        description: "The full course name and course code from NJIT course catalog."
                    }
                }
            },
            required: ["courses"],
            additionalProperties: false
        },
        strict: true
    }
}];

export const getCoursesTool = async (courseList: string[]) => {

    if (!courseList.length) return [];

    return db.select().from(courses).where(inArray(courses.name, courseList));

}
