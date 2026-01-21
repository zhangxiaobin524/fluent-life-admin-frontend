import { z } from 'zod';

// 登录表单验证
export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少6位'),
});

// 用户表单验证
export const userSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符').max(50, '用户名最多50个字符'),
  email: z.union([z.string().email('请输入有效的邮箱地址'), z.literal('')]).optional(),
  phone: z.union([z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'), z.literal('')]).optional(),
  role: z.string().min(1, '请选择角色'),
  status: z.enum(['active', 'inactive']),
});

// 角色表单验证
export const roleSchema = z.object({
  name: z.string().min(2, '角色名称至少2个字符'),
  code: z.string().min(2, '角色代码至少2个字符'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, '至少选择一个权限'),
});

