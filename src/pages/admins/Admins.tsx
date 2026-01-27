import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { User } from '../../types/index';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import UserModal from '../users/UserModal';
import { Plus, Edit, Trash2, Search, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

const Admins: React.FC = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

  useEffect(() => {
    loadAdmins();
  }, [page, keyword]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers({
        page,
        page_size: 20,
        keyword: keyword || undefined,
      });
      if (response.code === 0 && response.data) {
        // 只显示管理员和超级管理员
        const adminUsers = (response.data.users || []).filter(
          (user: User) => user.role === 'admin' || user.role === 'super_admin'
        );
        setAdmins(adminUsers);
        setTotal(adminUsers.length);
      }
    } catch (error) {
      console.error('加载管理员失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingAdmin(null);
    setModalVisible(true);
  };

  const handleEdit = (admin: User) => {
    setEditingAdmin(admin);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个管理员吗？此操作不可恢复！')) return;
    try {
      const response = await adminAPI.deleteUser(id);
      if (response.code === 0) {
        loadAdmins();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除管理员失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingAdmin(null);
    loadAdmins();
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      admin: { label: '管理员', color: 'bg-blue-100 text-blue-800' },
      super_admin: { label: '超级管理员', color: 'bg-purple-100 text-purple-800' },
    };
    const roleInfo = roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${roleInfo.color}`}>
        {roleInfo.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'username',
      title: '用户名',
      dataIndex: 'username' as keyof User,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'email',
      title: '邮箱',
      dataIndex: 'email' as keyof User,
      render: (value: string) => value || '-',
    },
    {
      key: 'phone',
      title: '手机号',
      dataIndex: 'phone' as keyof User,
      render: (value: string) => value || '-',
    },
    {
      key: 'role',
      title: '角色',
      dataIndex: 'role' as keyof User,
      render: (value: string) => getRoleBadge(value),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof User,
      render: (value: number) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === 1 ? '正常' : '禁用'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: '创建时间',
      dataIndex: 'created_at' as keyof User,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, admin: User) => (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="small"
            onClick={() => handleEdit(admin)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </Button>
          <Button
            variant="default"
            size="small"
            onClick={() => handleDelete(admin.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理员管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理系统管理员账号和权限</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增管理员
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索管理员用户名、邮箱或手机号..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={admins}
          loading={loading}
          striped
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (newPage) => setPage(newPage),
          }}
        />
      </Card>

      {modalVisible && (
        <UserModal
          visible={modalVisible}
          user={editingAdmin}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Admins;
