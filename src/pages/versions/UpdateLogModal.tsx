import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import UpdateLogFormModal from './UpdateLogFormModal';

interface UpdateLog {
  id: string;
  version_id: string;
  log_type: 'feature' | 'fix' | 'improvement';
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  version?: {
    id: string;
    version: string;
    version_code: number;
    platform: string;
  };
}

interface Props {
  visible: boolean;
  versionId: string;
  onClose: () => void;
}

const UpdateLogModal: React.FC<Props> = ({ visible, versionId, onClose }) => {
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<UpdateLog | null>(null);
  const [versionInfo, setVersionInfo] = useState<any>(null);

  useEffect(() => {
    if (visible && versionId) {
      loadVersionInfo();
      loadLogs();
    }
  }, [visible, versionId]);

  const loadVersionInfo = async () => {
    try {
      const response = await adminAPI.getVersion(versionId);
      if (response.code === 0 && response.data) {
        setVersionInfo(response.data);
      }
    } catch (error) {
      console.error('加载版本信息失败:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUpdateLogs({ version_id: versionId, page_size: 100 });
      if (response.code === 0 && response.data) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('加载更新日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormModalVisible(true);
  };

  const handleEdit = (item: UpdateLog) => {
    setEditingItem(item);
    setFormModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条更新日志吗？')) return;
    try {
      await adminAPI.deleteUpdateLog(id);
      loadLogs();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleClose = () => {
    setFormModalVisible(false);
    setEditingItem(null);
    loadLogs();
  };

  if (!visible) return null;

  const columns: Column<UpdateLog>[] = [
    {
      key: 'log_type',
      title: '类型',
      width: '10%',
      render: (_value: any, record: UpdateLog) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          feature: { label: '新功能', color: 'bg-green-100 text-green-800' },
          fix: { label: '修复', color: 'bg-red-100 text-red-800' },
          improvement: { label: '改进', color: 'bg-blue-100 text-blue-800' },
        };
        const type = typeMap[record.log_type] || typeMap.feature;
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
      width: '25%',
      render: (_value: any, record: UpdateLog) => (
        <div className="font-medium">{record.title}</div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      width: '45%',
      render: (_value: any, record: UpdateLog) => (
        <div className="text-sm text-gray-600 line-clamp-2">
          {record.description || '-'}
        </div>
      ),
    },
    {
      key: 'sort_order',
      title: '排序',
      width: '8%',
      render: (_value: any, record: UpdateLog) => (
        <span className="text-sm">{record.sort_order}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '12%',
      render: (_value: any, record: UpdateLog) => (
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">更新日志管理</h2>
              {versionInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  版本：{versionInfo.version} ({versionInfo.platform})
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <Button onClick={handleCreate} icon={<Plus size={16} />}>
              新建日志
            </Button>
          </div>
          <Table<UpdateLog> columns={columns} dataSource={logs} loading={loading} />
        </div>

        {formModalVisible && (
          <UpdateLogFormModal
            visible={formModalVisible}
            item={editingItem}
            versionId={versionId}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default UpdateLogModal;
