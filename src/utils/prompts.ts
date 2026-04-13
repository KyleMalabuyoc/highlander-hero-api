
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// In CommonJS (require), __dirname is a built-in that gives you the current file's directory. In ES modules (import/export) it doesn't exist
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// provide descriptions
export const scheduleCreationSystemPrompt = fs.readFileSync(
    path.join(__dirname, "../prompts/schedule-creation.md"),
    "utf-8"
);

export const scheduleEditSystemPrompt = fs.readFileSync(
    path.join(__dirname, "../prompts/schedule-edit.md"),
    "utf-8"
);