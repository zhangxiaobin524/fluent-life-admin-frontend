import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2, Sparkles } from 'lucide-react';
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

interface SyncConfig {
  id: number;
  sync_time: string;
  is_enabled: boolean;
  last_sync_date?: string;
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
  const [generating, setGenerating] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
  const [syncTime, setSyncTime] = useState('00:00');
  const [isEnabled, setIsEnabled] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadTongueTwisters();
    loadSyncConfig();
  }, [page, keyword, levelFilter]);

  const loadSyncConfig = async () => {
    try {
      setConfigLoading(true);
      const res = await adminAPI.getTongueTwisterSyncConfig();
      if (res.code === 0 && res.data) {
        setSyncConfig(res.data);
        setSyncTime(res.data.sync_time || '00:00');
        setIsEnabled(res.data.is_enabled);
      }
    } catch (error: any) {
      showMessage('error', '加载配置失败: ' + (error?.message || '未知错误'));
    } finally {
      setConfigLoading(false);
    }
  };

  const [showGenerateConfirmModal, setShowGenerateConfirmModal] = useState(false);

  const handleGenerate = () => {
    setShowGenerateConfirmModal(true);
  };

  const handleConfirmGenerate = async () => {
    try {
      setGenerating(true);
      setMessage(null);
      setShowGenerateConfirmModal(false);
      const res = await adminAPI.generateDailyTongueTwisters();
      if (res.code === 0) {
        setGenerateResult({ success: true, message: res.message || '绕口令生成成功！' });
        setShowGenerateModal(true);
        setTimeout(() => {
          loadTongueTwisters();
          loadSyncConfig();
        }, 1000);
      } else {
        setGenerateResult({ success: false, message: res.message || '生成失败' });
        setShowGenerateModal(true);
      }
    } catch (error: any) {
      setGenerateResult({
        success: false,
        message: '生成失败: ' + (error?.response?.data?.message || error?.message || '未知错误'),
      });
      setShowGenerateModal(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setConfigLoading(true);
      setMessage(null);
      const res = await adminAPI.updateTongueTwisterSyncConfig(syncTime, isEnabled);
      if (res.code === 0) {
        showMessage('success', '配置保存成功！');
        await loadSyncConfig();
      } else {
        showMessage('error', res.message || '保存失败');
      }
    } catch (error: any) {
      showMessage('error', '保存失败: ' + (error?.response?.data?.message || error?.message || '未知错误'));
    } finally {
      setConfigLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

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
      key: 'created_at',
      title: '生成时间',
      dataIndex: 'created_at' as keyof TongueTwister,
      render: (value: string) => (
        <span className="text-xs text-slate-600">
          {value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'}
        </span>
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
    <div className="p-6 space-y-4">
      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 绕口令列表 */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">绕口令管理</h1>
          <Button onClick={handleAdd} icon={<Plus size={16} />}>
            新增绕口令
          </Button>
        </div>

        {/* 生成功能 - 紧凑布局 */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* 左侧：手动生成 */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleGenerate} 
                disabled={generating}
                icon={<Sparkles size={14} />}
                className="text-sm py-1.5 px-3"
              >
                {generating ? '生成中...' : '立即生成'}
              </Button>
              <span className="text-xs text-slate-500">生成今日绕口令</span>
            </div>

            {/* 右侧：自动同步配置 */}
            <div className="flex items-center gap-4">
              {configLoading && !syncConfig ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-600">加载中...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">自动生成:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => setIsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">同步时间:</span>
                    <input
                      type="time"
                      value={syncTime}
                      onChange={(e) => setSyncTime(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {syncConfig?.last_sync_date && (
                    <span className="text-xs text-slate-500">
                      最后: {new Date(syncConfig.last_sync_date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}

                  <Button
                    onClick={handleSaveConfig}
                    disabled={configLoading}
                    className="text-sm py-1.5 px-3"
                  >
                    {configLoading ? '保存中...' : '保存'}
                  </Button>
                </>
              )}
            </div>
          </div>
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

      {/* 生成确认弹窗 */}
      {showGenerateConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGenerateConfirmModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">确认生成</h2>
              <button
                onClick={() => setShowGenerateConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 rounded-lg mb-4 bg-slate-50 border border-slate-200">
              <div className="text-slate-800">
                确定要立即生成今日绕口令吗？
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowGenerateConfirmModal(false)} className="bg-slate-200 text-slate-800 hover:bg-slate-300">
                取消
              </Button>
              <Button onClick={handleConfirmGenerate} disabled={generating}>
                确定
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 生成结果弹窗 */}
      {showGenerateModal && generateResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {generateResult.success ? '生成成功' : '生成失败'}
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={`p-4 rounded-lg mb-4 ${
              generateResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`flex items-center gap-2 ${
                generateResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {generateResult.success ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{generateResult.message}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowGenerateModal(false)}>
                确定
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TongueTwisters;
