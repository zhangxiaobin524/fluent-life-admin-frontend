import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DailyExpressionModal from './DailyExpressionModal';
import { format } from 'date-fns';
import { Switch } from 'antd'; // Add Switch import
import { message } from 'antd'; // Add message for notifications

interface DailyExpression {
  id: string;
  title: string;
  content: string;
  tips: string;
  source: string;
  date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DailyExpressions: React.FC = () => {
  const [expressions, setExpressions] = useState<DailyExpression[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyExpression | null>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadExpressions();
  }, [page, keyword]);

  const loadExpressions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: 20,
      };
      if (keyword) params.keyword = keyword;

      const response = await adminAPI.getDailyExpressions(params);
      if (response.code === 0 && response.data) {
        setExpressions(response.data.expressions || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载每日朗诵文案失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: DailyExpression) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`确定要删除这${ids.length}个文案吗？此操作不可恢复！`)) return;
    try {
      const response = await adminAPI.deleteDailyExpressionsBatch(ids);
      if (response.code === 0) {
        loadExpressions();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文案失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingItem(null);
    loadExpressions();
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const response = await adminAPI.updateDailyExpression(id, { is_active });
      if (response.code === 0) {
        message.success('状态更新成功');
        loadExpressions(); // Reload data to reflect changes
      } else {
        message.error(response.message || '状态更新失败');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('更新状态失败，请重试');
    }
  };

  const columns = [
    {
      key: 'title',
      title: '标题',
      dataIndex: 'title' as keyof DailyExpression,
    },
    {
      key: 'source',
      title: '来源',
      dataIndex: 'source' as keyof DailyExpression,
      render: (value: string) => value || '-',
    },
    {
      key: 'date',
      title: '发布日期',
      dataIndex: 'date' as keyof DailyExpression,
      render: (value: string) => {
        try {
          return format(new Date(value), 'yyyy-MM-dd');
        } catch {
          return value;
        }
      },
    },
    {
      key: 'content',
      title: '内容',
      dataIndex: 'content' as keyof DailyExpression,
      render: (value: string) => (
        <div className="max-w-md truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'is_active',
      title: '状态',
      dataIndex: 'is_active' as keyof DailyExpression,
      render: (value: boolean, record: DailyExpression) => (
        <Switch
          checked={value}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: DailyExpression) => (
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
          <h1 className="text-2xl font-bold">每日朗诵文案管理</h1>
          <Button onClick={handleAdd} icon={<Plus size={16} />}>
            新增文案
          </Button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索标题、内容或来源..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg w-full max-w-md"
          />
        </div>

        <Table
          columns={columns}
          dataSource={expressions}
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
        <DailyExpressionModal
          visible={modalVisible}
          editingItem={editingItem}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default DailyExpressions;
