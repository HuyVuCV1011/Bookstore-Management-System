import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toggle } from '../common/Toggle';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Định dạng email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await login(data.email, data.password, rememberMe);

      // Role-based redirect
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
      <div className="text-center mb-10">
        <Link to="/" className="mb-5 flex items-center justify-center gap-2 text-primary transition-opacity hover:opacity-85">
          <span className="grid h-9 w-9 place-items-center rounded-button bg-primary text-white shadow-sm">
            <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
            </svg>
          </span>
          <span className="text-xl font-bold text-ink">Nhà sách</span>
        </Link>
        <h1 className="text-4xl font-bold text-text-primary-light mb-2">
          Chào mừng trở lại
        </h1>
        <p className="text-text-secondary">Đăng nhập để quản lý tài khoản nhà sách của bạn</p>
      </div>

      {error && (
        <div className="app-alert-error">
          {error}
        </div>
      )}

      <Input
        {...register('email')}
        label="Email"
        type="text"
        variant="floating"
        error={errors.email?.message}
        autoComplete="new-password"
        inputMode="email"
        spellCheck={false}
      />

      <Input
        {...register('password')}
        label="Mật khẩu"
        type="password"
        variant="floating"
        error={errors.password?.message}
        autoComplete="new-password"
        spellCheck={false}
      />

      <div className="flex items-center justify-between">
        <Toggle
          checked={rememberMe}
          onChange={setRememberMe}
          label="Ghi nhớ đăng nhập"
        />
      </div>

      <Button type="submit" loading={isLoading}>
        Đăng nhập
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Đăng ký
        </Link>
      </p>
    </form>
  );
};
