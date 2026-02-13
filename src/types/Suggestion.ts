import { Course } from './Course.js';

export type SuggestionAction = 'add' | 'remove' | 'swap';

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

export interface Suggestion {
    id: string;
    action: SuggestionAction;
    reason: string;
    status: SuggestionStatus;
    originalCourse?: Course;
    proposedCourse?: Course;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    suggestions?: Suggestion[];
}
