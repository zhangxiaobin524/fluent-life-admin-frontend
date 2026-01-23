import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import AnnouncementModal from './AnnouncementModal';

interface Announcement {
  id: string;
  type: 'system' | 'feature' | 'event' | 'maintenance';
  priority: 'high' | 'normal' | 'low';
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  is_pinned: boolean;
  target_users: string;
  created_at: string;
  updated_at: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [type, setType] = useState<string>('');
  const [isActive, setIsActive] = useState<string>('');

  useEffect(() => {
    loadAnnouncements();
  }, [type, isActive]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: 100 };
      if (type) params.type = type;
      if (isActive) params.is_active = isActive;
      const response = await adminAPI.getAnnouncements(params);
      if (response.code === 0 && response.data) {
        setAnnouncements(response.data.announcements || []);
      }
    } catch (error) {
      console.error('加载公告列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: Announcement) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个公告吗？')) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingItem(null);
    loadAnnouncements();
  };

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      title: '标题',
      width: '20%',
      render: (_value: any, record: Announcement) => (
        <div>
          <div className="font-semibold text-gray-900">{record.title}</div>
          {record.is_pinned && (
            <span className="text-xs text-yellow-600">📌 置顶</span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: '10%',
      render: (_value: any, record: Announcement) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          system: { label: '系统', color: 'bg-blue-100 text-blue-800' },
          feature: { label: '功能', color: 'bg-green-100 text-green-800' },
          event: { label: '活动', color: 'bg-purple-100 text-purple-800' },
          maintenance: { label: '维护', color: 'bg-orange-100 text-orange-800' },
        };
        const type = typeMap[record.type] || typeMap.system;
        return (
          <span className={`px-2 py-1 rounded text-sm ${type.color}`}>
            {type.label}
          </span>
        );
      },
    },
    {
      key: 'priority',
      title: '优先级',
      width: '10%',
      render: (_value: any, record: Announcement) => {
        const priorityMap: Record<string, { label: string; color: string }> = {
          high: { label: '高', color: 'bg-red-100 text-red-800' },
          normal: { label: '普通', color: 'bg-gray-100 text-gray-800' },
          low: { label: '低', color: 'bg-blue-100 text-blue-800' },
        };
        const priority = priorityMap[record.priority] || priorityMap.normal;
        return (
          <span className={`px-2 py-1 rounded text-sm ${priority.color}`}>
            {priority.label}
          </span>
        );
      },
    },
    {
      key: 'content',
      title: '内容',
      width: '30%',
      render: (_value: any, record: Announcement) => (
        <div className="text-sm text-gray-600 line-clamp-2">
          {record.content || '-'}
        </div>
      ),
    },
    {
      key: 'target_users',
      title: '目标用户',
      width: '10%',
      render: (_value: any, record: Announcement) => (
        <span className="text-sm">{record.target_users || 'all'}</span>
      ),
    },
    {
      key: 'is_active',
      title: '状态',
      width: '8%',
      render: (_value: any, record: Announcement) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            record.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {record.is_active ? '激活' : '禁用'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '12%',
      render: (_value: any, record: Announcement) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(record)}
            className="text-indigo-600 hover:text-indigo-800"
            title="编辑"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-800"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">公告管理</h2>
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">全部类型</option>
              <option value="system">系统</option>
              <option value="feature">功能</option>
              <option value="event">活动</option>
              <option value="maintenance">维护</option>
            </select>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">全部状态</option>
              <option value="true">激活</option>
              <option value="false">禁用</option>
            </select>
            <Button onClick={handleCreate} icon={<Plus size={16} />}>
              新建公告
            </Button>
          </div>
        </div>
        <Table<Announcement> columns={columns} dataSource={announcements} loading={loading} />
      </Card>

      {modalVisible && (
        <AnnouncementModal
          visible={modalVisible}
          item={editingItem}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default Announcements;
