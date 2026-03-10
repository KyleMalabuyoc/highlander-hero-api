export type RegisterCognitoStatus = 'confirm-code' | 'account-exists' | 'too-many-requests' | 'error';
export type LoginCognitoStatus = 'user-not-found' | 'authenticated' | 'not-authenticated' | 'too-many-requests' | 'error';
export type SendCodeCognitoStatus = 'already-confirmed' | 'confirmed' | 'code-resent' | 'code-mismatch' | 'code-expired' | 'too-many-requests' | 'user-not-found' | 'error';

export interface RegisterResponse {
    message: string,
    destination: string | undefined,
    cognitoStatus: RegisterCognitoStatus
}

export interface AuthenticationResponse {
    accessToken: string,
    idToken: string
}