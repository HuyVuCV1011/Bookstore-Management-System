import React from 'react';
import type { Profile } from '../../types/profile';
import { Button } from '../common/Button';

interface ProfileViewProps {
  profile: Profile | null;
  onEdit: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onEdit }) => {
  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Email
          </label>
          <p className="text-text-primary-light dark:text-text-primary-dark">
            {profile.email}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Họ tên
          </label>
          <p className="text-text-primary-light dark:text-text-primary-dark">
            {profile.fullName || <span className="text-gray-400 italic">Chưa cập nhật</span>}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Số điện thoại
          </label>
          <p className="text-text-primary-light dark:text-text-primary-dark">
            {profile.phoneNumber || <span className="text-gray-400 italic">Chưa cập nhật</span>}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Địa chỉ giao hàng
          </label>
          <p className="text-text-primary-light dark:text-text-primary-dark whitespace-pre-line">
            {profile.address || <span className="text-gray-400 italic">Chưa cập nhật</span>}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Ngày đăng ký
          </label>
          <p className="text-text-primary-light dark:text-text-primary-dark">
            {new Date(profile.registrationDate).toLocaleDateString()}
          </p>
        </div>

        <Button onClick={onEdit}>Cập nhật hồ sơ</Button>
      </div>
    </div>
  );
};
