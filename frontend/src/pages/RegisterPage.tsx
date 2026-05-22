import React from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Card } from '../components/common/Card';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <AuthLayout>
      <Card className="max-w-[520px] mx-auto">
        <RegisterForm />
      </Card>
    </AuthLayout>
  );
};
