import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import TongueTwisterModal from './TongueTwisterModal';

interface TongueTwister {
  id: string;
  title: string;
  content: string;
  tips: string;
  level: 'basic' | 'intermediate' | 'advanced';
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TongueTwisters: React.FC = () => {
  const [tongueTwisters, setTongueTwisters] = useState<TongueTwister[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TongueTwister | null>(null);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    loadTongueTwisters();
  }, [page, keyword, levelFilter]);

  const loadTongueTwisters = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: 20,
      };
      if (keyword) params.keyword = keyword;
      if (levelFilter) params.level = levelFilter;

      const response = await adminAPI.getTongueTwisters(params);
      if (response.code === 0 && response.data) {
        setTongueTwisters(response.data.tongue_twisters || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载绕口令失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: TongueTwister) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`确定要删除这${ids.length}个绕口令吗？此操作不可恢复！`)) return;
    try {
      const response = await adminAPI.deleteTongueTwistersBatch(ids);
      if (response.code === 0) {
        loadTongueTwisters();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除绕口令失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingItem(null);
    loadTongueTwisters();
  };

  const levelMap: Record<string, string> = {
    basic: '基础',
    intermediate: '进阶',
    advanced: '高级',
  };

  const columns = [
    {
      key: 'title',
      title: '标题',
      dataIndex: 'title' as keyof TongueTwister,
    },
    {
      key: 'level',
      title: '难度',
      dataIndex: 'level' as keyof TongueTwister,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'basic' ? 'bg-green-100 text-green-700' :
          value === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {levelMap[value] || value}
        </span>
      ),
    },
    {
      key: 'order',
      title: '排序',
      dataIndex: 'order' as keyof TongueTwister,
    },
    {
      key: 'content',
      title: '内容',
      dataIndex: 'content' as keyof TongueTwister,
      render: (value: string) => (
        <div className="max-w-md truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'is_active',
      title: '状态',
      dataIndex: 'is_active' as keyof TongueTwister,
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {value ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: TongueTwister) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete([record.id])}
            className="text-red-600 hover:text-red-800"
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
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">绕口令管理</h1>
          <Button onClick={handleAdd} icon={<Plus size={16} />}>
            新增绕口令
          </Button>
        </div>

        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="搜索标题或内容..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg flex-1 max-w-md"
          />
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">全部难度</option>
            <option value="basic">基础</option>
            <option value="intermediate">进阶</option>
            <option value="advanced">高级</option>
          </select>
        </div>

        <Table
          columns={columns}
          dataSource={tongueTwisters}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
          }}
        />
      </Card>

      {modalVisible && (
        <TongueTwisterModal
          visible={modalVisible}
          editingItem={editingItem}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default TongueTwisters;
