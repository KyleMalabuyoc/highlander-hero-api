import { NextFunction, Request, Response } from "express";
import { NewScheduleRequest, UpdateScheduleRequest } from "../types/requests/Requests.js";
import {
    isValidConfirmationCode,
    isValidLlmQuery,
    isValidEmail,
    isValidGraduationYear,
    isValidId,
    isValidInterests,
    isValidMajor,
    isValidMinor,
    isValidPassword,
    isValidProgram,
    isValidSchedule,
    isValidScheduleName,
    isValidSemesterIndex,
} from "../utils/validators.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { formatMsg, logger } from "../config/logger/pino.js";

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    validate(isValidEmail(req.body.email) && isValidPassword(req.body.password), res, next);
};

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    validate(isValidEmail(req.body.email) && isValidPassword(req.body.password), res, next);
};

export const validateConfirm = (req: Request, res: Response, next: NextFunction) => {
    validate(isValidEmail(req.body.email) && isValidConfirmationCode(req.body.code), res, next);
};

export const validateResend = (req: Request, res: Response, next: NextFunction) => {
    validate(isValidEmail(req.body.email), res, next);
};

export const validateCancel = (req: Request, res: Response, next: NextFunction) => {
    validate(isValidEmail(req.body.email), res, next);
};

export const validateNewSchedule = (req: Request, res: Response, next: NextFunction) => {

    const newScheduleRequest: NewScheduleRequest = req.body;

    if (newScheduleRequest == null || newScheduleRequest.studentInfo == null) {
        return res.status(400).json(new ResponseEntity(400, {}, "Request is missing parameters."));
    }

    const { scheduleName, studentInfo } = newScheduleRequest;

    validate(
        isValidScheduleName(scheduleName) &&
        isValidId(studentInfo.major?.id) && isValidMajor(studentInfo.major?.name) &&
        isValidProgram(studentInfo.program) &&
        isValidGraduationYear(studentInfo.graduationYear) &&
        (studentInfo.minor != null ? isValidId(studentInfo.minor?.id) && isValidMinor(studentInfo.minor?.name) : true) &&
        (studentInfo.interests != null && studentInfo.interests.length > 0 ? isValidInterests(studentInfo.interests) : true),
        res,
        next
    );
};

export const validateEditSchedule = (req: Request, res: Response, next: NextFunction) => {

    const { schedule, semesterIndex, query } = req.body;

    if (schedule == null || semesterIndex == null || !query) {
        return res.status(400).json(new ResponseEntity(400, {}, "Request is missing parameters."));
    }

    // isValidSchedule confirms semesters is a valid array, so the bounds check is safe
    validate(
        isValidSchedule(schedule) &&
        isValidSemesterIndex(semesterIndex) &&
        semesterIndex < (schedule?.semesters?.length ?? 0) &&
        isValidLlmQuery(query),
        res,
        next
    );
};

export const validateUpdateSchedule = (req: Request, res: Response, next: NextFunction) => {
    const request: UpdateScheduleRequest = req.body;

    if (!request || request.semesterId == null || !request.originalCourseIds || !request.updatedCourseIds) {
        return res.status(400).json(new ResponseEntity(400, {}, "Request is missing parameters."));
    }

    const isValidIdArray = (ids: unknown): boolean =>
        Array.isArray(ids) && ids.length <= 50 && ids.every((id) => isValidId(id));

    validate(
        isValidId(request.semesterId) &&
        isValidIdArray(request.originalCourseIds) &&
        isValidIdArray(request.updatedCourseIds),
        res,
        next
    );
};

// Returns early on failure so next() is never called when validation fails.
const validate = (valid: boolean, res: Response, next: NextFunction) => {
    if (!valid) {
        logger.error(formatMsg("VALIDATION", "validate"), "Bad request. Invalid request body." );
        return res.status(400).json(new ResponseEntity(400, {}, "Bad request. Invalid request body."));
    }
    next();
};
