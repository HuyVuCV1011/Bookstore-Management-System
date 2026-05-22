import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ProfileView } from '../components/profile/ProfileView';
import type { Profile } from '../types/profile';
import profileApi from '../services/profileApi';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await profileApi.getProfile();
      setProfile(data);

      // If profile is incomplete, start in edit mode
      if (!data.profileCompleted) {
        setIsEditing(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin cá nhân');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchProfile();
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Only allow cancel if profile is already complete
    if (profile?.profileCompleted) {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-light via-gray-50 to-blue-50 dark:from-bg-dark dark:via-gray-900 dark:to-blue-900 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-light via-gray-50 to-blue-50 dark:from-bg-dark dark:via-gray-900 dark:to-blue-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-gray-50 to-blue-50 dark:from-bg-dark dark:via-gray-900 dark:to-blue-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Thông tin cá nhân
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Về trang chủ
          </button>
        </div>

        {!profile?.profileCompleted && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Hoàn thiện thông tin cá nhân để đặt hàng
            </p>
          </div>
        )}

        {isEditing ? (
          <ProfileForm
            profile={profile}
            onSuccess={handleSuccess}
            onCancel={profile?.profileCompleted ? handleCancel : undefined}
          />
        ) : (
          <ProfileView profile={profile} onEdit={() => setIsEditing(true)} />
        )}
      </div>
    </div>
  );
};
