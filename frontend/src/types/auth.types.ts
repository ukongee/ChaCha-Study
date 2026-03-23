export interface User {
  id: number;
  email: string;
  nickname: string;
  department: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
  department: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
