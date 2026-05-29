export const ACADEMIC_SERVICE = 'AcademicService';
export const AUTH_SERVICE = 'AuthService';
export const LLM_SERVICE = 'LLMService';

export const ACADEMIC_METHODS = {
    GET_COURSES: 'getCourses',
    GET_MAJORS: 'getMajors',
    GET_MINORS: 'getMinors',
} as const;

export const AUTH_METHODS = {
    LOGIN: 'login',
    REGISTER: 'register',
    CONFIRM: 'confirm',
    RESEND_CODE: 'resendCode',
    REFRESH: 'refresh',
    LOGOUT: 'logout',
    CANCEL: 'cancel',
} as const;

export const LLM_METHODS = {
    CREATE_SCHEDULE: 'createSchedule',
    EDIT_SCHEDULE: 'editSchedule',
} as const;

export const SCHEDULE_SERVICE = 'ScheduleService';

export const SCHEDULE_METHODS = {
    GET_SCHEDULES: 'getSchedules',
    CREATE_NEW_SCHEDULE: 'createNewSchedule',
    LLM_EDIT_SCHEDULE: 'llmEditSchedule',
    UPDATE_SCHEDULE: 'updateSchedule',
} as const;

export const PINECONE_SERVICE = 'PineconeService';

export const PINECONE_METHODS = {
    QUERY_FOR_SCHEDULE_CREATION: 'pineconeQueryForScheduleCreation',
    SIMPLE_PINECONE_CALL: 'simplePineconeCall',
} as const;
