import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Notification } from '../types/index';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import { Search, Trash2, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Column } from '../components/common/Table';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isReadFilter, setIsReadFilter] = useState<string>('');
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [page, keyword, typeFilter, isReadFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getNotifications({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        type: typeFilter || undefined,
        is_read: isReadFilter || undefined,
      });
      if (response.code === 0 && response.data) {
        setNotifications(response.data.notifications || []);
        setTotal(response.data.total || 0);
        setSelectedNotificationIds([]);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getNotificationStats();
      if (response.code === 0 && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = notifications.map((n) => n.id);
      setSelectedNotificationIds(allIds);
    } else {
      setSelectedNotificationIds([]);
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotificationIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((notificationId) => notificationId !== id)
        : [...prevSelected, id]
    );
  };

  const handleBatchDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`确定要删除这 ${ids.length} 条通知吗？此操作不可恢复！`)) return;

    try {
      const response = await adminAPI.deleteNotificationsBatch(ids);
      if (response.code === 0) {
        loadNotifications();
        loadStats();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      alert('删除失败，请重试');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      comment: '评论',
      like: '点赞',
      follow: '关注',
      practice_reminder: '练习提醒',
      achievement: '成就解锁',
      mention: '@提及',
    };
    return typeMap[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      comment: '💬',
      like: '❤️',
      follow: '👤',
      practice_reminder: '⏰',
      achievement: '🏆',
      mention: '📢',
    };
    return iconMap[type] || '🔔';
  };

  const columns: Column<Notification>[] = [
    {
      key: 'selection',
      title: (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-blue-600"
          checked={selectedNotificationIds.length === notifications.length && notifications.length > 0}
          onChange={handleSelectAll}
        />
      ),
      render: (_: any, record: Notification) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-blue-600"
          checked={selectedNotificationIds.includes(record.id)}
          onChange={() => handleSelectNotification(record.id)}
        />
      ),
      width: '50px',
    },
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: Notification) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(record.type)}</span>
          <span className="text-sm text-gray-900">{getTypeLabel(record.type)}</span>
        </div>
      ),
    },
    {
      key: 'title',
      title: '标题',
      dataIndex: 'title' as keyof Notification,
      render: (value: string, record: Notification) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{value}</span>
          {!record.is_read && (
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          )}
        </div>
      ),
    },
    {
      key: 'content',
      title: '内容',
      render: (_: any, record: Notification) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-600 line-clamp-2">{record.content}</p>
        </div>
      ),
    },
    {
      key: 'user_id',
      title: '用户ID',
      dataIndex: 'user_id' as keyof Notification,
      render: (value: string) => (
        <span className="text-sm text-gray-500 font-mono">{value.substring(0, 8)}...</span>
      ),
    },
    {
      key: 'is_read',
      title: '状态',
      dataIndex: 'is_read' as keyof Notification,
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {value ? '已读' : '未读'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: '创建时间',
      dataIndex: 'created_at' as keyof Notification,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Notification) => (
        <button
          onClick={() => handleBatchDelete([record.id])}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">通知管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统通知内容</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card shadow>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总通知数</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </Card>
          <Card shadow>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">未读通知</p>
                  <p className="text-2xl font-semibold text-blue-600">{stats.unread || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </Card>
          <Card shadow>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已读通知</p>
                  <p className="text-2xl font-semibold text-green-600">{stats.read || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </Card>
          <Card shadow>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日通知</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.today_count || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card shadow>
        <div className="mb-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索通知标题或内容..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部类型</option>
              <option value="comment">评论</option>
              <option value="like">点赞</option>
              <option value="follow">关注</option>
              <option value="practice_reminder">练习提醒</option>
              <option value="achievement">成就解锁</option>
              <option value="mention">@提及</option>
            </select>
            <select
              value={isReadFilter}
              onChange={(e) => {
                setIsReadFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部状态</option>
              <option value="false">未读</option>
              <option value="true">已读</option>
            </select>
            <button
              onClick={() => handleBatchDelete(selectedNotificationIds)}
              disabled={selectedNotificationIds.length === 0}
              className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors ${
                selectedNotificationIds.length === 0
                  ? 'bg-red-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              批量删除 ({selectedNotificationIds.length})
            </button>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={notifications}
          loading={loading}
          striped
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (newPage) => {
              setPage(newPage);
              setSelectedNotificationIds([]);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Notifications;
