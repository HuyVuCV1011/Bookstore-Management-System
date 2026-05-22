import axiosInstance from '../utils/axiosConfig';

export type UserItem = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
};

export type UsersPage = {
  users: UserItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
};

export type UserUpdatePayload = Partial<Pick<
  UserItem,
  'fullName' | 'phoneNumber' | 'address' | 'role' | 'isActive'
>>;

export type UserCreatePayload = Pick<
  UserItem,
  'email' | 'fullName' | 'phoneNumber' | 'address' | 'role'
> & {
  password: string;
};

export const adminService = {
  getUsers: async (page = 0, size = 20, role?: string, keyword?: string): Promise<UsersPage> => {
    const params: Record<string, unknown> = { page, size };
    if (role && role !== 'ALL') params.role = role;
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    const { data } = await axiosInstance.get('/admin/users', { params });
    return data;
  },

  createUser: async (payload: UserCreatePayload): Promise<UserItem> => {
    const { data } = await axiosInstance.post('/admin/users', payload);
    return data.user;
  },

  updateRole: async (id: string, role: 'CUSTOMER' | 'STAFF' | 'ADMIN'): Promise<UserItem> => {
    const { data } = await axiosInstance.put(`/admin/users/${id}`, { role });
    return data.user;
  },

  updateUser: async (id: string, payload: UserUpdatePayload): Promise<UserItem> => {
    const { data } = await axiosInstance.put(`/admin/users/${id}`, payload);
    return data.user;
  },

  toggleActive: async (id: string, isActive: boolean): Promise<UserItem> => {
    const { data } = await axiosInstance.put(`/admin/users/${id}`, { isActive });
    return data.user;
  },

  deactivateUser: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/admin/users/${id}`);
  },
};
