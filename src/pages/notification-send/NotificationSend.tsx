import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Send, History, Users, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const NotificationSend: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Notification[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // 发送表单
  const [formData, setFormData] = useState({
    user_ids: [] as string[],
    type: 'system',
    title: '',
    content: '',
    sendToAll: false,
  });

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyPage]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getNotificationSendHistory({
        page: historyPage,
        page_size: 20,
      });
      if (response.code === 0) {
        setHistory(response.data.notifications || []);
        setHistoryTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载发送历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title.trim()) {
      alert('请输入通知标题');
      return;
    }

    if (!formData.sendToAll && formData.user_ids.length === 0) {
      alert('请选择接收用户或选择发送给所有用户');
      return;
    }

    if (!confirm(`确定要发送通知给 ${formData.sendToAll ? '所有用户' : formData.user_ids.length + ' 个用户'} 吗？`)) {
      return;
    }

    setSending(true);
    try {
      const response = await adminAPI.sendNotification({
        user_ids: formData.sendToAll ? [] : formData.user_ids,
        type: formData.type,
        title: formData.title,
        content: formData.content,
      });

      if (response.code === 0) {
        alert(`通知发送成功！已发送给 ${response.data.sent_count || 0} 个用户`);
        setFormData({
          user_ids: [],
          type: 'system',
          title: '',
          content: '',
          sendToAll: false,
        });
      } else {
        alert(response.message || '发送失败');
      }
    } catch (error: any) {
      console.error('发送通知失败:', error);
      alert(error.response?.data?.message || '发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const columns = [
    {
      key: 'title',
      title: '标题',
      dataIndex: 'title' as keyof Notification,
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type' as keyof Notification,
      render: (value: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          {value === 'system' ? '系统通知' : value}
        </span>
      ),
    },
    {
      key: 'content',
      title: '内容',
      dataIndex: 'content' as keyof Notification,
      render: (value: string) => (
        <span className="text-sm text-gray-700 max-w-md truncate block" title={value}>
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: '发送时间',
      dataIndex: 'created_at' as keyof Notification,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">通知发送管理</h1>
        <p className="mt-1 text-sm text-gray-500">发送系统通知给用户</p>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Send className="w-4 h-4" />
            发送通知
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="w-4 h-4" />
            发送历史
          </button>
        </nav>
      </div>

      {/* 发送通知标签页 */}
      {activeTab === 'send' && (
        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通知类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="system">系统通知</option>
                <option value="practice_reminder">练习提醒</option>
                <option value="achievement">成就解锁</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通知标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入通知标题"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通知内容
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入通知内容（可选）"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sendToAll}
                  onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked, user_ids: [] })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">发送给所有用户</span>
              </label>
              {!formData.sendToAll && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    提示：如需发送给指定用户，请在用户管理页面选择用户后发送通知
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="default"
                onClick={() => {
                  setFormData({
                    user_ids: [],
                    type: 'system',
                    title: '',
                    content: '',
                    sendToAll: false,
                  });
                }}
                disabled={sending}
              >
                重置
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? '发送中...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    发送通知
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 发送历史标签页 */}
      {activeTab === 'history' && (
        <Card>
          <Table
            columns={columns}
            dataSource={history}
            loading={loading}
            striped
            pagination={{
              current: historyPage,
              pageSize: 20,
              total: historyTotal,
              onChange: (newPage) => setHistoryPage(newPage),
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default NotificationSend;
