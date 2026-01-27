import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { Search, Trash2, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import AIConversationDetailModal from './AIConversationDetailModal';

interface AIConversation {
  id: string;
  user_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'bot';
    text: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const AIConversations: React.FC = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);

  useEffect(() => {
    loadConversations();
  }, [page, keyword]);

  const loadConversations = async () => {
    setLoading(true);
    setSelectedConversationIds([]);
    try {
      const response = await adminAPI.getAIConversations({
        page,
        page_size: 20,
        user_id: keyword || undefined,
      });
      if (response.code === 0) {
        setConversations(response.data.conversations || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载AI对话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadConversations();
  };

  const handleViewDetail = async (conversation: AIConversation) => {
    try {
      const response = await adminAPI.getAIConversation(conversation.id);
      if (response.code === 0) {
        setSelectedConversation(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('获取对话详情失败:', error);
    }
  };

  const handleDeleteBatch = async () => {
    if (selectedConversationIds.length === 0) {
      alert('请选择要删除的对话');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedConversationIds.length} 条对话吗？`)) {
      return;
    }
    try {
      const response = await adminAPI.deleteAIConversationsBatch(selectedConversationIds);
      if (response.code === 0) {
        alert('删除成功');
        loadConversations();
      } else {
        alert('删除失败: ' + response.message);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConversationIds(conversations.map(c => c.id));
    } else {
      setSelectedConversationIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedConversationIds([...selectedConversationIds, id]);
    } else {
      setSelectedConversationIds(selectedConversationIds.filter(i => i !== id));
    }
  };

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedConversationIds.length === conversations.length && conversations.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      render: (_value: any, record: AIConversation) => (
        <input
          type="checkbox"
          checked={selectedConversationIds.includes(record.id)}
          onChange={(e) => handleSelectOne(record.id, e.target.checked)}
        />
      ),
    },
    {
      key: 'user',
      title: '用户',
      render: (_value: any, record: AIConversation) => (
        <div className="flex items-center gap-2">
          {record.user?.avatar_url ? (
            <img src={record.user.avatar_url} alt={record.user.username} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <span>{record.user?.username || '未知用户'}</span>
        </div>
      ),
    },
    {
      key: 'message_count',
      title: '消息数量',
      render: (_value: any, record: AIConversation) => record.messages?.length || 0,
    },
    {
      key: 'last_message',
      title: '最后消息',
      render: (_value: any, record: AIConversation) => {
        const lastMessage = record.messages && record.messages.length > 0 
          ? record.messages[record.messages.length - 1] 
          : null;
        if (!lastMessage) return '-';
        const text = lastMessage.text || '';
        return (
          <div className="max-w-md truncate" title={text}>
            {text.substring(0, 50)}{text.length > 50 ? '...' : ''}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      title: '创建时间',
      render: (_value: any, record: AIConversation) => format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: 'updated_at',
      title: '更新时间',
      render: (_value: any, record: AIConversation) => format(new Date(record.updated_at), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_value: any, record: AIConversation) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetail(record)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI对话管理</h2>
          {selectedConversationIds.length > 0 && (
            <button
              onClick={handleDeleteBatch}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              批量删除 ({selectedConversationIds.length})
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索用户ID..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              搜索
            </button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={conversations}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (newPage, _pageSize) => setPage(newPage),
          }}
        />
      </Card>

      {showDetailModal && selectedConversation && (
        <AIConversationDetailModal
          conversation={selectedConversation}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedConversation(null);
          }}
        />
      )}
    </div>
  );
};

export default AIConversations;
