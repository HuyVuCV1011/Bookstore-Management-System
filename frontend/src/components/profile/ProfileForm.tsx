import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import type { Profile } from '../../types/profile';
import profileApi from '../../services/profileApi';

interface ProfileFormProps {
  profile: Profile | null;
  onSuccess: () => void;
  onCancel?: () => void;
  isCheckout?: boolean;
}

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format'),
  address: z.string().min(1, 'Address is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSuccess,
  onCancel,
  isCheckout = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      address: profile?.address || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      await profileApi.updateProfile(data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isCheckout && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Please complete your profile to continue with checkout
          </p>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        {...register('fullName')}
        label="Full Name"
        type="text"
        error={errors.fullName?.message}
        autoComplete="name"
      />

      <Input
        {...register('phoneNumber')}
        label="Phone Number"
        type="tel"
        placeholder="+1234567890"
        error={errors.phoneNumber?.message}
        autoComplete="tel"
      />

      <div>
        <label className="block text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">
          Delivery Address
        </label>
        <textarea
          {...register('address')}
          className={`
            w-full px-4 py-3 rounded-input border transition-all duration-300
            bg-white dark:bg-gray-800
            ${errors.address
              ? 'border-error focus:border-error focus:shadow-[0_0_0_4px_rgba(255,59,48,0.2)]'
              : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:shadow-input-focus'
            }
            text-text-primary-light dark:text-text-primary-dark
            outline-none resize-none
          `}
          rows={3}
          placeholder="123 Main St, City, Country"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-error flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.address.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>
          Save Profile
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
