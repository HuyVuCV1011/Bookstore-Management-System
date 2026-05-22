export type User = {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  profileCompleted: boolean;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export type RegisterData = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  address: string;
}

export type LoginData = {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<LoginResponse>;
  register: (data: Omit<RegisterData, 'confirmPassword'>) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  checkAuth: () => Promise<void>;
}

export type LoginResponse = {
  accessToken: string;
  user: User;
}

export type TokenResponse = {
  accessToken: string;
}

export type UserResponse = {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  address: string | null;
  profileCompleted: boolean;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export type ErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  errors?: Record<string, string>;
}
