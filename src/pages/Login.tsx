import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../utils/validation';
import { adminAPI } from '../services/api';
import FormItem from '../components/form/FormItem';
import Input from '../components/form/Input';
import Button from '../components/form/Button';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await adminAPI.login(data.username, data.password);
      if (response.code === 0) {
        onLogin();
      } else {
        alert(response.message || '登录失败');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">流畅人生管理后台</h2>
          <p className="mt-2 text-sm text-gray-600">Fluent Life Admin Panel</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormItem label="用户名" required error={errors.username?.message}>
              <Input
                {...register('username')}
                placeholder="请输入用户名"
                error={!!errors.username}
              />
            </FormItem>

            <FormItem label="密码" required error={errors.password?.message}>
              <Input
                {...register('password')}
                type="password"
                placeholder="请输入密码"
                error={!!errors.password}
              />
            </FormItem>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
                className="w-full"
              >
                登录
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                默认账号: <span className="font-medium text-gray-700">admin</span> /{' '}
                <span className="font-medium text-gray-700">admin123</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
