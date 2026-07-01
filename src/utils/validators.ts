// Validation helper functions

const isString = (val: unknown): val is string => typeof val === 'string';

// Null bytes (\x00) can truncate bcrypt hashes and bypass C-string comparisons.
// All other control chars (including \r\n) can cause HTTP header injection.
const CONTROL_CHAR_PATTERN = /[\x00-\x1F\x7F]/;

// Zero-width and invisible Unicode characters used to evade text-based filters.
const ZERO_WIDTH_PATTERN = /[​-‍⁠﻿­]/;

// Catches encoded payloads that may not be decoded before reaching validators:
// %00 = null, %27 = apostrophe, %22 = quote, %3C/%3E = angle brackets, %2D%2D = --
const URL_ENCODED_ATTACK_PATTERN = /%(?:00|27|22|3[cCeE]|2[dD]{2})/;

// Expanded SQL injection: covers comment-based space bypass (union/**/select),
// hex encoding (0x41), and blind/timing attacks (SLEEP, WAITFOR, BENCHMARK).
const SQL_INJECTION_PATTERN =
    /('|"|`|--|;|\/\*|\*\/|xp_|0x[0-9a-f]+|union[\s/*]+|select[\s/*]+|insert[\s/*]+|update[\s/*]+|delete[\s/*]+|drop[\s/*]+|exec[\s/*]+|execute[\s/*]+|waitfor[\s/*]+delay|sleep\s*\(|benchmark\s*\(|load_file\s*\(|into\s+outfile|into\s+dumpfile|information_schema|char\s*\(|concat\s*\()/i;

// XSS: script/HTML tags, JS/VBS/data protocol handlers, inline event handlers,
// and numeric/hex HTML entities.
const XSS_PATTERN = /<[^>]*?>|javascript\s*:|vbscript\s*:|data\s*:|on\w+\s*=|&#\d+;|&#x[0-9a-f]+;/i;

// Runs the full dangerous-content suite for fields that are stored and potentially rendered.
const hasDangerousContent = (val: string): boolean =>
    CONTROL_CHAR_PATTERN.test(val) ||
    ZERO_WIDTH_PATTERN.test(val) ||
    URL_ENCODED_ATTACK_PATTERN.test(val) ||
    SQL_INJECTION_PATTERN.test(val) ||
    XSS_PATTERN.test(val);

export const isValidEmail = (email: unknown): boolean => {
    if (!isString(email) || !email.trim()) return false;
    const trimmed = email.trim();
    if (hasDangerousContent(trimmed)) return false;
    // Stricter than the previous regex: requires a real TLD (2+ alpha chars)
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

export const isValidPassword = (password: unknown): boolean =>
    isString(password) && password.length >= 8 && password.length <= 100;

// Whitelist is the primary defense; control/zero-width checks are belt-and-suspenders.
export const isValidScheduleName = (name: unknown): boolean => {
    if (!isString(name) || !name.trim()) return false;
    const trimmed = name.trim();
    if (trimmed.length > 300) return false;
    if (CONTROL_CHAR_PATTERN.test(trimmed) || ZERO_WIDTH_PATTERN.test(trimmed)) return false;
    return /^[a-zA-Z0-9 \-'.,:]+$/.test(trimmed);
};

const SAFE_TEXT_PATTERN = /^[a-zA-Z0-9 \-'.]+$/;

export const isValidMajor = (major: unknown): boolean => {
    if (!isString(major) || !major.trim()) return false;
    const trimmed = major.trim();
    if (CONTROL_CHAR_PATTERN.test(trimmed) || ZERO_WIDTH_PATTERN.test(trimmed)) return false;
    return SAFE_TEXT_PATTERN.test(trimmed);
};

export const isValidMinor = (minor: unknown): boolean => {
    if (!isString(minor)) return false;
    const trimmed = minor.trim();
    if (CONTROL_CHAR_PATTERN.test(trimmed) || ZERO_WIDTH_PATTERN.test(trimmed)) return false;
    return SAFE_TEXT_PATTERN.test(trimmed);
};

export const isValidGraduationYear = (year: unknown): boolean => {
    if (year === null || year === undefined) return false;
    const str = String(year).trim();
    if (!str || CONTROL_CHAR_PATTERN.test(str)) return false;
    return /^\d{4}$/.test(str);
};

export const isValidProgram = (program: unknown): boolean => {
    if (!isString(program) || !program.trim()) return false;
    if (CONTROL_CHAR_PATTERN.test(program) || ZERO_WIDTH_PATTERN.test(program)) return false;
    return /^(undergraduate|masters)$/i.test(program.trim());
};

const MAX_INTERESTS_COUNT = 50;
const MAX_INTEREST_LENGTH = 100;

export const isValidConfirmationCode = (code: unknown): boolean => {
    if (code === null || code === undefined) return false;
    return /^\d{6}$/.test(String(code).trim());
};

export const isValidInterests = (interests: unknown): boolean => {
    if (!Array.isArray(interests) || interests.length > MAX_INTERESTS_COUNT) return false;
    return interests.every(
        (item) =>
            typeof item === 'string' &&
            item.trim().length > 0 &&
            item.trim().length <= MAX_INTEREST_LENGTH &&
            !hasDangerousContent(item)
    );
};

// ── LLM query ─────────────────────────────────────────────────────────────────

// Prompt injection: attempts to override system instructions or escape the prompt context.
const PROMPT_INJECTION_PATTERN =
    /ignore\s+(previous|prior|all|above|system)\s+(instructions?|prompts?|context|rules?)|system\s*:|<\|im_start\||<\|im_end\||<\|system\||###\s*instruction|###\s*system|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>/i;

// 500 chars: enough for a detailed schedule edit instruction, short enough to limit
// token abuse and reduce the surface area for prompt injection payloads.
const MAX_LLM_QUERY_LENGTH = 500;

export const isValidLlmQuery = (query: unknown): boolean => {
    if (!isString(query) || !query.trim()) return false;
    const trimmed = query.trim();
    if (trimmed.length > MAX_LLM_QUERY_LENGTH) return false;
    if (CONTROL_CHAR_PATTERN.test(trimmed)) return false;
    if (ZERO_WIDTH_PATTERN.test(trimmed)) return false;
    if (URL_ENCODED_ATTACK_PATTERN.test(trimmed)) return false;
    if (PROMPT_INJECTION_PATTERN.test(trimmed)) return false;
    return true;
};

// ── Shared helpers ────────────────────────────────────────────────────────────

// Positive integer DB id
export const isValidId = (id: unknown): boolean =>
    typeof id === 'number' && Number.isInteger(id) && id > 0;

// Like PASSWORD_INJECTION_PATTERN but without ';' — semicolons are normal punctuation
// in academic descriptions and jobRelevancy values (e.g. "Data Scientist (...); Engineer (...)").
// SQL keyword alternatives require more complete SQL structure so natural-language phrases
// like "select from options" or "drop a course" don't false-positive.
const DESCRIPTION_INJECTION_PATTERN =
    /--|\/\*|\*\/|xp_|0x[0-9a-f]{2,}|union[\s/*]+select\b|select[\s/*]+(?:\*|[\w"`.]+(?:\s*,\s*[\w"`.]+)*)[\s/*]+from\b|insert[\s/*]+into\b|update[\s/*]+\w+[\s/*]+set\b|delete[\s/*]+from\b|drop[\s/*]+(?:table|database|schema|view|index|function|procedure)\b|exec[\s/*]+|execute[\s/*]*\(|waitfor[\s/*]+delay|sleep\s*\(|benchmark\s*\(/i;

// Allows bare apostrophes/quotes and semicolons (natural language text).
// Multi-character SQL keyword sequences and XSS are still blocked.
const isDescriptionSafe = (val: string): boolean =>
    !CONTROL_CHAR_PATTERN.test(val) &&
    !ZERO_WIDTH_PATTERN.test(val) &&
    !URL_ENCODED_ATTACK_PATTERN.test(val) &&
    !XSS_PATTERN.test(val) &&
    !DESCRIPTION_INJECTION_PATTERN.test(val);

// ── Course ────────────────────────────────────────────────────────────────────

// Alphanumeric, spaces, dashes, forward-slash, asterisk, colon, ampersand, plus, and period
const COURSE_NAME_PATTERN = /^[a-zA-Z0-9 \-/*:&+.,]+$/;

export const isValidCourseName = (name: unknown): boolean => {
    if (!isString(name) || !name.trim()) return false;
    const trimmed = name.trim();
    if (trimmed.length > 200) return false;
    if (CONTROL_CHAR_PATTERN.test(trimmed) || ZERO_WIDTH_PATTERN.test(trimmed)) return false;
    return COURSE_NAME_PATTERN.test(trimmed);
};

// Course codes are purely numeric (e.g. 1301, 44301); 1–6 digits
export const isValidCourseCode = (code: unknown): boolean => {
    if (code === null || code === undefined) return false;
    return /^\d{1,6}$/.test(String(code).trim());
};

export const isValidCourseDescription = (description: unknown): boolean => {
    if (!isString(description) || !description.trim()) return false;
    const trimmed = description.trim();
    if (trimmed.length > 2500) return false;
    return isDescriptionSafe(trimmed);
};

// Credits: 0–6, decimals allowed (e.g. 0.5 for half-credit)
export const isValidCourseCredits = (credits: unknown): boolean => {
    if (typeof credits !== 'number' || !isFinite(credits) || isNaN(credits)) return false;
    return credits >= 0 && credits <= 6;
};

// Locked to known status slugs — alphanumeric + dashes only, no freeform
const VALID_COURSE_STATUSES = new Set(['planned', 'in-progress', 'completed', 'dropped', 'n/a']);

export const isValidCourseStatus = (status: unknown): boolean => {
    if (!isString(status) || !status.trim()) return false;
    return VALID_COURSE_STATUSES.has(status.trim().toLowerCase());
};

// Covers all observed course type slugs from the LLM and DB
const VALID_COURSE_TYPES = new Set([
    'cs-core', 'cs-elective', 'math-core', 'english-core', 'writing-core', 'science-core',
    'design-core', 'design-elective', 'seminar', 'elective', 'gen-ed', 'lab', 'capstone',
    'engineering-core', 'engineering-elective', 'major',
]);

export const isValidCourseType = (type: unknown): boolean => {
    if (!isString(type) || !type.trim()) return false;
    return VALID_COURSE_TYPES.has(type.trim().toLowerCase());
};

const MAX_PREREQUISITES = 20;

export const isValidCourse = (course: unknown): boolean => {
    if (typeof course !== 'object' || course === null || Array.isArray(course)) return false;
    const c = course as Record<string, unknown>;
    if (c.id !== undefined && !isValidId(c.id)) { console.error('[validator] invalid id:', c.name, c.id); return false; }
    if (!isValidCourseName(c.name)) { console.error('[validator] invalid name:', c.name); return false; }
    if (!isValidCourseCode(c.code)) { console.error('[validator] invalid code:', c.name, c.code); return false; }
    if (!isValidCourseDescription(c.description)) { console.error('[validator] invalid description:', c.name); return false; }
    if (!isValidCourseCredits(c.credits)) { console.error('[validator] invalid credits:', c.name, c.credits); return false; }
    if (!isValidCourseStatus(c.status)) { console.error('[validator] invalid status:', c.name, c.status); return false; }
    if (!isValidCourseType(c.type)) { console.error('[validator] invalid type:', c.name, c.type); return false; }
    if (!Array.isArray(c.prerequisites) || (c.prerequisites as unknown[]).length > MAX_PREREQUISITES) { console.error('[validator] invalid prerequisites array:', c.name, (c.prerequisites as unknown[])?.length); return false; }
    if (!(c.prerequisites as unknown[]).every(p => isValidId(p) || isValidCourse(p))) { console.error('[validator] invalid prerequisite item in:', c.name); return false; }
    if (c.jobRelevancy !== undefined && !isValidCourseDescription(c.jobRelevancy)) { console.error('[validator] invalid jobRelevancy:', c.name); return false; }
    return true;
};

// ── Semester ──────────────────────────────────────────────────────────────────

// Allows letters, numbers, spaces, dashes, and commas — no injection chars
// Covers formats like "Fall 2024", "Spring", "Year 1 - Fall", "Semester 1"
export const isValidSemesterName = (name: unknown): boolean => {
    if (!isString(name) || !name.trim()) return false;
    const trimmed = name.trim();
    if (trimmed.length > 100) return false;
    if (CONTROL_CHAR_PATTERN.test(trimmed) || ZERO_WIDTH_PATTERN.test(trimmed)) return false;
    return /^[a-zA-Z0-9 \-,]+$/.test(trimmed);
};

// Non-negative integer; semester and year positions are 0-based
export const isValidSemesterIndex = (index: unknown): boolean =>
    typeof index === 'number' && Number.isInteger(index) && index >= 0;

const MAX_COURSES_PER_SEMESTER = 10;

export const isValidSemester = (semester: unknown): boolean => {
    if (typeof semester !== 'object' || semester === null || Array.isArray(semester)) return false;
    const s = semester as Record<string, unknown>;
    if (!isValidSemesterName(s.name)) return false;
    if (!isValidSemesterIndex(s.index)) return false;
    if (s.yearIndex !== undefined && !isValidSemesterIndex(s.yearIndex)) return false;
    if (!Array.isArray(s.courses) || (s.courses as unknown[]).length > MAX_COURSES_PER_SEMESTER) return false;
    if (!(s.courses as unknown[]).every(isValidCourse)) return false;
    return true;
};

// ── Schedule ──────────────────────────────────────────────────────────────────

const MAX_SEMESTERS = 20;

export const isValidSchedule = (schedule: unknown): boolean => {
    if (typeof schedule !== 'object' || schedule === null || Array.isArray(schedule)) return false;
    const s = schedule as Record<string, unknown>;
    if (s.id !== undefined && !isValidId(s.id)) return false;
    if (!isValidScheduleName(s.name)) return false;
    if (!Array.isArray(s.semesters) || (s.semesters as unknown[]).length > MAX_SEMESTERS) return false;
    if (!(s.semesters as unknown[]).every(isValidSemester)) return false;
    return true;
};
