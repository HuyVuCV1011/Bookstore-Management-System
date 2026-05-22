import axiosInstance from '../utils/axiosConfig';
import type { Profile, UpdateProfileRequest } from '../types/profile';

const profileApi = {
  getProfile: async (): Promise<Profile> => {
    const response = await axiosInstance.get<Profile>('/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<Profile> => {
    const response = await axiosInstance.put<Profile>('/profile', data);
    return response.data;
  },
};

export default profileApi;
