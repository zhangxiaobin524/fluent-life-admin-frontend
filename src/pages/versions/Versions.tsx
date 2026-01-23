import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import VersionModal from './VersionModal';
import UpdateLogModal from './UpdateLogModal';

interface AppVersion {
  id: string;
  version: string;
  version_code: number;
  platform: string;
  update_type: 'force' | 'normal' | 'silent';
  title: string;
  description: string;
  download_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// UpdateLog 接口定義（UpdateLogModal 中使用）
// @ts-ignore - 類型定義，用於 UpdateLogModal
interface UpdateLog {
  id: string;
  version_id: string;
  log_type: 'feature' | 'fix' | 'improvement';
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
}

const Versions: React.FC = () => {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AppVersion | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    loadVersions();
  }, [platform]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: 100 };
      if (platform) params.platform = platform;
      const response = await adminAPI.getVersions(params);
      if (response.code === 0 && response.data) {
        setVersions(response.data.versions || []);
      }
    } catch (error) {
      console.error('加载版本列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: AppVersion) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个版本吗？')) return;
    try {
      await adminAPI.updateVersion(id, { is_active: false });
      loadVersions();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleViewLogs = (versionId: string) => {
    setSelectedVersionId(versionId);
    setLogModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingItem(null);
    loadVersions();
  };

  const handleLogClose = () => {
    setLogModalVisible(false);
    setSelectedVersionId('');
  };

  const columns: Column<AppVersion>[] = [
    {
      key: 'version',
      title: '版本信息',
      width: '15%',
      render: (_value: any, record: AppVersion) => (
        <div>
          <div className="font-semibold text-gray-900">{record.version}</div>
          <div className="text-xs text-gray-500">Code: {record.version_code}</div>
        </div>
      ),
    },
    {
      key: 'platform',
      title: '平台',
      width: '10%',
      render: (_value: any, record: AppVersion) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {record.platform}
        </span>
      ),
    },
    {
      key: 'update_type',
      title: '更新类型',
      width: '10%',
      render: (_value: any, record: AppVersion) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          force: { label: '强制', color: 'bg-red-100 text-red-800' },
          normal: { label: '普通', color: 'bg-blue-100 text-blue-800' },
          silent: { label: '静默', color: 'bg-gray-100 text-gray-800' },
        };
        const type = typeMap[record.update_type] || typeMap.normal;
        return (
          <span className={`px-2 py-1 rounded text-sm ${type.color}`}>
            {type.label}
          </span>
        );
      },
    },
    {
      key: 'title',
      title: '标题',
      width: '20%',
      render: (_value: any, record: AppVersion) => (
        <div className="font-medium">{record.title}</div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      width: '25%',
      render: (_value: any, record: AppVersion) => (
        <div className="text-sm text-gray-600 line-clamp-2">
          {record.description || '-'}
        </div>
      ),
    },
    {
      key: 'is_active',
      title: '状态',
      width: '8%',
      render: (_value: any, record: AppVersion) => (
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
      render: (_value: any, record: AppVersion) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewLogs(record.id)}
            className="text-blue-600 hover:text-blue-800"
            title="查看日志"
          >
            <FileText size={16} />
          </button>
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
          <h2 className="text-xl font-bold text-gray-900">版本管理</h2>
          <div className="flex gap-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">全部平台</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="web">Web</option>
            </select>
            <Button onClick={handleCreate} icon={<Plus size={16} />}>
              新建版本
            </Button>
          </div>
        </div>
        <Table<AppVersion> columns={columns} dataSource={versions} loading={loading} />
      </Card>

      {modalVisible && (
        <VersionModal
          visible={modalVisible}
          item={editingItem}
          onClose={handleClose}
        />
      )}

      {logModalVisible && (
        <UpdateLogModal
          visible={logModalVisible}
          versionId={selectedVersionId}
          onClose={handleLogClose}
        />
      )}
    </div>
  );
};

export default Versions;
