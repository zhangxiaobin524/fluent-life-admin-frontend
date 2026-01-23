import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import FeatureGuideModal from './FeatureGuideModal';

interface FeatureGuide {
  id: string;
  feature_key: string;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  steps?: any;
  platform: string;
  version?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const FeatureGuides: React.FC = () => {
  const [guides, setGuides] = useState<FeatureGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<FeatureGuide | null>(null);
  const [platform, setPlatform] = useState<string>('');
  const [isActive, setIsActive] = useState<string>('');

  useEffect(() => {
    loadGuides();
  }, [platform, isActive]);

  const loadGuides = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: 100 };
      if (platform) params.platform = platform;
      if (isActive) params.is_active = isActive;
      const response = await adminAPI.getFeatureGuides(params);
      if (response.code === 0 && response.data) {
        setGuides(response.data.guides || []);
      }
    } catch (error) {
      console.error('加载功能引导列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: FeatureGuide) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个功能引导吗？')) return;
    try {
      await adminAPI.deleteFeatureGuide(id);
      loadGuides();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingItem(null);
    loadGuides();
  };

  const columns: Column<FeatureGuide>[] = [
    {
      key: 'feature_key',
      title: '功能标识',
      width: '15%',
      render: (_value: any, record: FeatureGuide) => (
        <div className="font-mono text-sm">{record.feature_key}</div>
      ),
    },
    {
      key: 'title',
      title: '标题',
      width: '20%',
      render: (_value: any, record: FeatureGuide) => (
        <div className="font-semibold text-gray-900">{record.title}</div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      width: '30%',
      render: (_value: any, record: FeatureGuide) => (
        <div className="text-sm text-gray-600 line-clamp-2">
          {record.description || '-'}
        </div>
      ),
    },
    {
      key: 'platform',
      title: '平台',
      width: '10%',
      render: (_value: any, record: FeatureGuide) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {record.platform}
        </span>
      ),
    },
    {
      key: 'sort_order',
      title: '排序',
      width: '8%',
      render: (_value: any, record: FeatureGuide) => (
        <span className="text-sm">{record.sort_order}</span>
      ),
    },
    {
      key: 'is_active',
      title: '状态',
      width: '8%',
      render: (_value: any, record: FeatureGuide) => (
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
      width: '9%',
      render: (_value: any, record: FeatureGuide) => (
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
          <h2 className="text-xl font-bold text-gray-900">功能引导管理</h2>
          <div className="flex gap-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">全部平台</option>
              <option value="all">全部</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="web">Web</option>
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
              新建引导
            </Button>
          </div>
        </div>
        <Table<FeatureGuide> columns={columns} dataSource={guides} loading={loading} />
      </Card>

      {modalVisible && (
        <FeatureGuideModal
          visible={modalVisible}
          item={editingItem}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default FeatureGuides;
