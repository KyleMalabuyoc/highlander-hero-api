import { Course } from '../types/Course.js';
import { Semester } from '../types/Semester.js';
import { Schedule } from '../types/Schedule.js';
import { StudentInfo } from '../types/StudentInfo.js';
import { LoginInfo } from '../types/LoginInfo.js';

// ===== COURSES =====

export const cs100: Course = {
    id: 1,
    name: 'Introduction to Computer Science',
    code: 100,
    description: 'An introduction to computer science and programming fundamentals using Python.',
    credits: 3,
    status: 'complete',
    prerequisites: [],
    type: 'cs-core',
};

export const cs113: Course = {
    id: 2,
    name: 'Introduction to Computer Science II',
    code: 113,
    description: 'Continuation of CS 100. Object-oriented programming, data structures, and algorithms.',
    credits: 3,
    status: 'complete',
    prerequisites: [cs100],
    type: 'cs-core',
};

export const cs280: Course = {
    id: 3,
    name: 'Programming Language Concepts',
    code: 280,
    description: 'Study of programming language concepts including syntax, semantics, and paradigms.',
    credits: 3,
    status: 'complete',
    prerequisites: [cs113],
    type: 'cs-core',
};

export const cs288: Course = {
    id: 4,
    name: 'Intensive Programming in Linux',
    code: 288,
    description: 'Advanced programming in C/C++ in a Linux environment. Shell scripting and system calls.',
    credits: 3,
    status: 'complete',
    prerequisites: [cs113],
    type: 'cs-core',
};

export const cs331: Course = {
    id: 5,
    name: 'Database System Design and Management',
    code: 331,
    description: 'Fundamentals of database design, SQL, normalization, and database management systems.',
    credits: 3,
    status: 'in-progress',
    prerequisites: [cs113],
    type: 'cs-core',
};

export const cs341: Course = {
    id: 6,
    name: 'Computer Architecture and Organization',
    code: 341,
    description: 'Computer architecture, assembly language, memory hierarchy, and I/O systems.',
    credits: 3,
    status: 'in-progress',
    prerequisites: [cs113],
    type: 'cs-core',
};

export const cs356: Course = {
    id: 7,
    name: 'Operating Systems Design',
    code: 356,
    description: 'Process management, memory management, file systems, and concurrent programming.',
    credits: 3,
    status: 'in-progress',
    prerequisites: [cs288, cs341],
    type: 'cs-core',
};

export const cs431: Course = {
    id: 8,
    name: 'Introduction to Web Development',
    code: 431,
    description: 'Full-stack web development including HTML, CSS, JavaScript, and server-side programming.',
    credits: 3,
    status: 'in-progress',
    prerequisites: [cs280],
    type: 'elective',
};

export const cs490: Course = {
    id: 9,
    name: 'Guided Design in Software Engineering',
    code: 490,
    description: 'Capstone project course. Team-based software development with industry practices.',
    credits: 3,
    status: 'in-progress',
    prerequisites: [cs331, cs356],
    type: 'seminar',
};

export const math111: Course = {
    id: 10,
    name: 'Calculus I',
    code: 111,
    description: 'Limits, derivatives, and integrals of single-variable functions.',
    credits: 4,
    status: 'complete',
    prerequisites: [],
    type: 'math-core',
};

export const math112: Course = {
    id: 11,
    name: 'Calculus II',
    code: 112,
    description: 'Techniques of integration, sequences, series, and introduction to differential equations.',
    credits: 4,
    status: 'complete',
    prerequisites: [math111],
    type: 'math-core',
};

export const math211: Course = {
    id: 12,
    name: 'Calculus III',
    code: 211,
    description: 'Multivariable calculus including partial derivatives and multiple integrals.',
    credits: 4,
    status: 'complete',
    prerequisites: [math112],
    type: 'math-core',
};

export const math222: Course = {
    id: 13,
    name: 'Differential Equations',
    code: 222,
    description: 'First and second order differential equations with applications.',
    credits: 3,
    status: 'complete',
    prerequisites: [math112],
    type: 'math-core',
};

export const math337: Course = {
    id: 14,
    name: 'Linear Algebra',
    code: 337,
    description: 'Vector spaces, matrices, linear transformations, eigenvalues and eigenvectors.',
    credits: 3,
    status: 'complete',
    prerequisites: [math112],
    type: 'math-core',
};

export const cs435: Course = {
    id: 15,
    name: 'Advanced Data Structures and Algorithm Design',
    code: 435,
    description: 'Advanced algorithms, complexity analysis, graph algorithms, and dynamic programming.',
    credits: 3,
    status: 'in-progress',
    prerequisites: [cs280, math337],
    type: 'cs-core',
};

// ===== SEMESTERS =====

export const fall2022: Semester = {
    name: 'Fall 2022',
    index: 0,
    courses: [cs100, math111]
};

export const spring2023: Semester = {
    name: 'Spring 2023',
    index: 1,
    courses: [cs113, math112]
};

export const fall2023: Semester = {
    name: 'Fall 2023',
    index: 2,
    courses: [cs280, cs288, math211]
};

export const spring2024: Semester = {
    name: 'Spring 2024',
    index: 3,
    courses: [cs331, math222, math337]
};

export const fall2024: Semester = {
    name: 'Fall 2024',
    index: 4,
    courses: [cs341, cs356, cs431]
};

export const spring2025: Semester = {
    name: 'Spring 2025',
    index: 5,
    courses: [cs435, cs490]
};

// ===== STUDENT INFO =====

export const dummyStudentInfo: StudentInfo = {
    major: 'Computer Science',
    minor: 'AI',
    graduationYear: 2026,
    currentYear: 'Junior',
    interests: [cs431, cs435, cs490],
    transfer: false,
    currentCredits: 72
};

export const dummyAlternateStudentInfo: StudentInfo = {
    major: 'Computer Science',
    minor: 'Mathematics',
    graduationYear: 2025,
    currentYear: 'Senior',
    interests: [cs435, cs490],
    transfer: true,
    currentCredits: 90
};

// ===== SCHEDULES =====

export const dummyCurrentSchedule: Schedule = {
    name: 'My CS Degree Plan',
    semesters: [fall2022, spring2023, fall2023, spring2024, fall2024, spring2025],
    studentInfo: dummyStudentInfo
};

export const dummyAlternateSchedule: Schedule = {
    name: 'Accelerated Plan',
    semesters: [
        { name: 'Fall 2022', index: 0, courses: [cs100, math111, math112] },
        { name: 'Spring 2023', index: 1, courses: [cs113, cs280, math211] },
        { name: 'Fall 2023', index: 2, courses: [cs288, cs331, cs341, math337] },
        { name: 'Spring 2024', index: 3, courses: [cs356, cs431, cs435] },
        { name: 'Fall 2024', index: 4, courses: [cs490] },
    ],
    studentInfo: dummyAlternateStudentInfo
};

export const dummySavedSchedules: Schedule[] = [
    dummyCurrentSchedule,
    dummyAlternateSchedule
];

// ===== LOGIN INFO (full response mock) =====

export const dummyLoginResponse: LoginInfo = {
    username: 'JoshuaButter13',
    currentSchedule: dummyCurrentSchedule,
    savedSchedules: dummySavedSchedules
};
