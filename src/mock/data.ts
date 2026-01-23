import { User, Post, Room, TrainingRecord, Role, Menu } from '../types/index';

// Mock 用户数据
export const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `user-${i + 1}`,
  username: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `138${String(i).padStart(8, '0')}`,
  role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'editor' : 'user',
  status: i % 5 === 0 ? 0 : 1, // 0-禁用, 1-正常
  created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  last_login_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

// Mock 帖子数据
export const mockPosts: Post[] = Array.from({ length: 30 }, (_, i) => ({
  id: `post-${i + 1}`,
  user_id: `user-${(i % 10) + 1}`,
  content: `这是第 ${i + 1} 条帖子内容，包含一些示例文本用于展示。`,
  tag: ['心得分享', '训练记录', '问题求助'][i % 3],
  likes_count: Math.floor(Math.random() * 100),
  comments_count: Math.floor(Math.random() * 50),
  created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  user: mockUsers[i % 10],
}));

// Mock 房间数据
export const mockRooms: Room[] = Array.from({ length: 20 }, (_, i) => ({
  id: `room-${i + 1}`,
  user_id: `user-${(i % 5) + 1}`,
  title: `练习房间 ${i + 1}`,
  theme: ['日常对话', '商务沟通', '演讲练习'][i % 3],
  type: ['公开房间', '私密房间', '限时房间'][i % 3],
  max_members: [2, 4, 6, 8][i % 4],
  current_members: Math.floor(Math.random() * 5) + 1,
  is_active: i % 3 !== 0,
  created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  user: mockUsers[i % 5],
}));

// Mock 训练记录
export const mockTrainingRecords: TrainingRecord[] = Array.from({ length: 100 }, (_, i) => ({
  id: `record-${i + 1}`,
  user_id: `user-${(i % 20) + 1}`,
  type: ['meditation', 'airflow', 'exposure', 'practice'][i % 4],
  duration: Math.floor(Math.random() * 60 + 5) * 60,
  timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  user: mockUsers[i % 20],
}));

// Mock 角色数据
export const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: '超级管理员',
    code: 'super_admin',
    description: '拥有所有权限',
    permissions: ['*'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-2',
    name: '管理员',
    code: 'admin',
    description: '拥有管理权限',
    permissions: ['user:read', 'user:write', 'post:read', 'post:write'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-3',
    name: '编辑',
    code: 'editor',
    description: '拥有编辑权限',
    permissions: ['post:read', 'post:write'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'role-4',
    name: '普通用户',
    code: 'user',
    description: '普通用户权限',
    permissions: ['post:read'],
    created_at: new Date().toISOString(),
  },
];

// Mock 菜单数据
export const mockMenus: Menu[] = [
  {
    id: 'menu-1',
    name: '数据概览',
    path: '/',
    icon: 'dashboard',
    sort: 1,
  },
  {
    id: 'menu-2',
    name: '用户管理',
    path: '/users',
    icon: 'users',
    sort: 2,
  },
  {
    id: 'menu-3',
    name: '帖子管理',
    path: '/posts',
    icon: 'file-text',
    sort: 3,
  },
  {
    id: 'menu-4',
    name: '房间管理',
    path: '/rooms',
    icon: 'home',
    sort: 4,
  },
  {
    id: 'menu-5',
    name: '训练统计',
    path: '/training',
    icon: 'bar-chart',
    sort: 5,
  },
  {
    id: 'menu-6',
    name: '权限管理',
    path: '/permission',
    icon: 'shield',
    sort: 6,
    children: [
      {
        id: 'menu-6-1',
        name: '角色管理',
        path: '/permission/roles',
        sort: 1,
      },
      {
        id: 'menu-6-2',
        name: '菜单管理',
        path: '/permission/menus',
        sort: 2,
      },
    ],
  },
  {
    id: 'menu-7',
    name: '系统设置',
    path: '/settings',
    icon: 'settings',
    sort: 7,
  },
];

