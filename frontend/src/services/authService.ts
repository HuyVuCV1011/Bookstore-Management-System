import axiosInstance from '../utils/axiosConfig';
import type { LoginResponse, TokenResponse, User, UserResponse } from '../types';

// Mock data for development (until backend is ready)
const MOCK_MODE = false;

const mockUsers = [
  {
    id: '1',
    email: import.meta.env.VITE_MOCK_ADMIN_EMAIL || 'admin@example.test',
    password: import.meta.env.VITE_MOCK_ADMIN_PASSWORD || 'change-me-admin-password',
    fullName: 'Demo Administrator',
    phoneNumber: '+10000000000',
    address: 'Demo Address',
    role: 'ADMIN' as const,
    isActive: true,
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'customer@example.com',
    password: import.meta.env.VITE_MOCK_CUSTOMER_PASSWORD || 'change-me-customer-password',
    fullName: 'Demo Customer',
    phoneNumber: '+10000000001',
    address: 'Demo Address',
    role: 'CUSTOMER' as const,
    isActive: true,
    profileCompleted: true,
    createdAt: new Date().toISOString(),
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    address: string;
  }): Promise<UserResponse> {
    if (MOCK_MODE) {
      await delay(1000);

      // Check if email already exists
      if (mockUsers.find(u => u.email === data.email)) {
        throw {
          response: {
            status: 409,
            data: {
              message: 'Email already exists',
              errors: { email: 'This email is already registered' }
            }
          }
        };
      }

      const newUser = {
        id: String(mockUsers.length + 1),
        ...data,
        role: 'CUSTOMER' as const,
        isActive: true,
        profileCompleted: true,
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);

      const { password, ...userResponse } = newUser;
      return userResponse;
    }

    const response = await axiosInstance.post<UserResponse>('/auth/register', data);
    return response.data;
  },

  async login(email: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
    if (MOCK_MODE) {
      await delay(1000);

      const user = mockUsers.find(u => u.email === email);

      if (!user || user.password !== password) {
        throw {
          response: {
            status: 401,
            data: {
              message: 'Invalid email or password'
            }
          }
        };
      }

      if (!user.isActive) {
        throw {
          response: {
            status: 403,
            data: {
              message: 'Account has been deactivated. Contact admin.'
            }
          }
        };
      }

      const { password: _, ...userResponse } = user;
      return {
        accessToken: 'mock-access-token-' + user.id,
        user: userResponse,
      };
    }

    // Get device info and IP address
    const deviceInfo = navigator.userAgent;
    const ipAddress = 'client'; // IP will be captured by backend from request

    const response = await axiosInstance.post<LoginResponse>('/auth/login', {
      email,
      password,
      rememberMe,
      deviceInfo,
      ipAddress,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    if (MOCK_MODE) {
      await delay(500);
      return;
    }

    await axiosInstance.post('/auth/logout');
  },

  async refreshToken(): Promise<TokenResponse> {
    if (MOCK_MODE) {
      await delay(500);
      return {
        accessToken: 'mock-refreshed-token',
      };
    }

    const response = await axiosInstance.post<TokenResponse>('/auth/refresh');
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    if (MOCK_MODE) {
      await delay(500);
      // Return mock admin user
      const { password, ...user } = mockUsers[0];
      return user;
    }

    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },
};
