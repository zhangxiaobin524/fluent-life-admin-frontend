import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '../../utils/validation';
import { User } from '../../types/index';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Select from '../../components/form/Select';
import Button from '../../components/form/Button';
import { X } from 'lucide-react';

interface UserModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

interface UserFormData {
  username: string;
  email?: string;
  phone?: string;
  role: string;
  status: 0 | 1; // 0-禁用, 1-正常
}

const UserModal: React.FC<UserModalProps> = ({ visible, user, onClose }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      role: 'user',
      status: 1, // 默认正常
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        status: user.status, // 假设 user.status 已经是 0 或 1
      });
    } else {
      reset({
        username: '',
        email: '',
        phone: '',
        role: 'user',
        status: 1, // 默认正常
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormData) => {
    // TODO: 调用 API 保存用户
    console.log('保存用户:', data);
    alert(user ? '用户更新成功' : '用户创建成功');
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {user ? '编辑用户' : '新增用户'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <FormItem label="用户名" required error={errors.username?.message}>
            <Input
              {...register('username')}
              placeholder="请输入用户名"
              error={!!errors.username}
            />
          </FormItem>

          <FormItem label="邮箱" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              placeholder="请输入邮箱"
              error={!!errors.email}
            />
          </FormItem>

          <FormItem label="手机号" error={errors.phone?.message}>
            <Input
              {...register('phone')}
              placeholder="请输入手机号"
              error={!!errors.phone}
            />
          </FormItem>

          <FormItem label="角色" required error={errors.role?.message}>
            <Select
              {...register('role')}
              options={[
                { label: '普通用户', value: 'user' },
                { label: '编辑', value: 'editor' },
                { label: '管理员', value: 'admin' },
              ]}
              error={!!errors.role}
            />
          </FormItem>

          <FormItem label="状态" required error={errors.status?.message}>
            <Select
              {...register('status', { valueAsNumber: true })}
              options={[
                { label: '正常', value: 1 },
                { label: '禁用', value: 0 },
              ]}
              error={!!errors.status}
            />
          </FormItem>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button variant="default" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="primary">
              确定
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;

