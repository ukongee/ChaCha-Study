// Supabase Auth 기반으로 변경
// User 타입은 @supabase/supabase-js의 User 사용
export type { User } from "@supabase/supabase-js";

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// 하위 호환 (legacy auth.api.ts)
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
