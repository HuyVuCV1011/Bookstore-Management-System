import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

const registerSchema = z.object({
  email: z.string().email('Định dạng email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'Họ tên là bắt buộc'),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Định dạng số điện thoại không hợp lệ'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      // Show success message and redirect to login
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      const fieldErrors = err?.response?.data?.errors;

      if (fieldErrors?.email) {
        setError(fieldErrors.email);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Tạo tài khoản</h1>
        <p className="text-gray-500 text-sm">Tham gia Nhà sách</p>
      </div>

      {error && (
        <div className="app-alert-error">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Thông tin tài khoản</h2>
          <div className="space-y-4">
            <Input
              {...register('email')}
              label="Email"
              type="email"
              error={errors.email?.message}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              label="Mật khẩu"
              type="password"
              error={errors.password?.message}
              autoComplete="new-password"
            />

            <Input
              {...register('confirmPassword')}
              label="Xác nhận mật khẩu"
              type="password"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Thông tin cá nhân</h2>
          <div className="space-y-4">
            <Input
              {...register('fullName')}
              label="Họ tên"
              type="text"
              error={errors.fullName?.message}
              autoComplete="name"
            />

            <Input
              {...register('phoneNumber')}
              label="Số điện thoại"
              type="tel"
              error={errors.phoneNumber?.message}
              autoComplete="tel"
              placeholder="+84123456789"
            />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Địa chỉ giao hàng</h2>
          <textarea
            {...register('address')}
            className={`
              w-full px-4 py-3 rounded-input border transition-all duration-300
              bg-white
              ${errors.address
                ? 'border-error focus:border-error focus:shadow-[0_0_0_4px_rgba(192,57,43,0.2)]'
                : 'border-border focus:border-primary focus:shadow-input-focus'
              }
              text-gray-800
              outline-none resize-none
            `}
            rows={3}
            placeholder="123 Đường ABC, Thành phố, Quốc gia"
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
      </div>

      <Button type="submit" loading={isLoading}>
        Đăng ký
      </Button>

      <p className="text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
};
