/**
 * Auth service — register and login API calls.
 * Uses axiosClient configured for the Gulliver API.
 */
import axiosClient from './axiosClient';

export interface RegisterPayload {
  employee_number: string;
  name: string;
  password: string;
  email?: string;
  role?: string;
  dept?: string;
}

export interface LoginPayload {
  employee_number: string;
  password: string;
}

export interface UserData {
  id: number;
  employee_number: string;
  name: string;
  email: string | null;
  role: string;
  dept: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData;
}

/**
 * Register a new user.
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await axiosClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

/**
 * Login with employee_number + password.
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await axiosClient.post<AuthResponse>('/auth/login', payload);
  return data;
}
