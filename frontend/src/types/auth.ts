export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProfileUpdatePayload {
  full_name: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
