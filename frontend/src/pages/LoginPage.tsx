import React from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Card } from '../components/common/Card';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <Card>
        <LoginForm />
      </Card>
    </AuthLayout>
  );
};
