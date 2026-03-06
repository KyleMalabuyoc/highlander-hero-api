export type AuthStatus = 'confirm-code' | 'account-exists' | 'code-resent' | 'too-many-requests' | 'code-mismatch' | 'code-expired' | 'user-not-found' | 'confirmed' | 'authenticated' | 'error';

export interface RegisterResponse {
    message: string,
    destination: string | undefined,
    cognitoStatus: AuthStatus
}