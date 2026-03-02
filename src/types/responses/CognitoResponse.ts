export type AuthStatus = 'confirm-code' | 'confirmed' | 'authenticated' | 'error';

export interface RegisterResponse {
    message: string,
    destination: string | undefined,
    cognitoStatus: AuthStatus
}