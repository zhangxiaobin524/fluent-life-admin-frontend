import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2, Calendar, FileText } from 'lucide-react';
import DailyExpressionModal from './DailyExpressionModal';
import { format } from 'date-fns';
import { Switch, TimePicker, Tabs } from 'antd'; // Add Tabs import
import { message } from 'antd'; // Add message for notifications
import dayjs from 'dayjs';

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
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);
  const [syncTime, setSyncTime] = useState<string>('03:00');
  const [useGPT, setUseGPT] = useState<boolean>(true);
  const [gptModel, setGptModel] = useState<string>('gpt-3.5-turbo');
  const [hasAPIKey, setHasAPIKey] = useState<boolean>(false);
  const [showGPTConfig, setShowGPTConfig] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('list');
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(false);
  const [syncLogsPage, setSyncLogsPage] = useState(1);
  const [syncLogsTotal, setSyncLogsTotal] = useState(0);

  useEffect(() => {
    if (activeTab === 'list') {
      loadExpressions();
    } else if (activeTab === 'history') {
      loadSyncLogs();
    }
  }, [page, keyword, activeTab, syncLogsPage]);

  useEffect(() => {
    const loadAutoSyncSetting = async () => {
      try {
        const response = await adminAPI.getDailyExpressionAutoSyncSetting();
        if (response.code === 0 && response.data) {
          setAutoSyncEnabled(!!response.data.enabled);
          if (response.data.sync_time) {
            setSyncTime(response.data.sync_time);
          }
          if (response.data.use_gpt !== undefined) {
            setUseGPT(!!response.data.use_gpt);
          }
          if (response.data.gpt_model) {
            setGptModel(response.data.gpt_model);
          }
          if (response.data.has_api_key !== undefined) {
            setHasAPIKey(!!response.data.has_api_key);
          }
        }
      } catch (error) {
        console.error('加载每日朗诵自动同步设置失败:', error);
      }
    };
    loadAutoSyncSetting();
  }, []);

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

  const handleToggleAutoSync = async (checked: boolean) => {
    setAutoSyncLoading(true);
    try {
      // 確保使用當前的 syncTime 值，如果為空則使用默認值
      const currentSyncTime = syncTime || '03:00';
      const response = await adminAPI.updateDailyExpressionAutoSyncSetting(checked, currentSyncTime, useGPT, gptModel);
      if (response.code === 0) {
        setAutoSyncEnabled(checked);
        // 使用響應中的時間（確保與後端一致），但不要覆蓋用戶剛剛設定的時間
        if (response.data?.sync_time && response.data.sync_time !== currentSyncTime) {
          setSyncTime(response.data.sync_time);
        }
        if (response.data?.use_gpt !== undefined) {
          setUseGPT(!!response.data.use_gpt);
        }
        if (response.data?.has_api_key !== undefined) {
          setHasAPIKey(!!response.data.has_api_key);
        }
        message.success(checked ? `已开启每日自动${useGPT ? '生成' : '抓取'}朗诵文章，将在每天 ${response.data?.sync_time || currentSyncTime} 执行` : '已关闭每日自动抓取');
      } else {
        message.error(response.message || '更新自动同步设置失败');
      }
    } catch (error) {
      console.error('更新自动同步设置失败:', error);
      message.error('更新自动同步设置失败，请稍后重试');
    } finally {
      setAutoSyncLoading(false);
    }
  };

  const handleToggleGPT = async (checked: boolean) => {
    setAutoSyncLoading(true);
    try {
      const currentSyncTime = syncTime || '03:00';
      const response = await adminAPI.updateDailyExpressionAutoSyncSetting(autoSyncEnabled, currentSyncTime, checked, gptModel);
      if (response.code === 0) {
        setUseGPT(checked);
        if (response.data?.has_api_key !== undefined) {
          setHasAPIKey(!!response.data.has_api_key);
        }
        if (!checked && !hasAPIKey) {
          message.warning('已关闭 GPT 生成，将使用网站抓取方式');
        } else {
          message.success(checked ? '已开启 GPT 生成文章' : '已关闭 GPT 生成，将使用网站抓取');
        }
      } else {
        message.error(response.message || '更新 GPT 设置失败');
      }
    } catch (error) {
      console.error('更新 GPT 设置失败:', error);
      message.error('更新 GPT 设置失败，请稍后重试');
    } finally {
      setAutoSyncLoading(false);
    }
  };

  const handleSaveGPTConfig = async () => {
    if (!apiKey.trim()) {
      message.error('请输入 OpenAI API Key');
      return;
    }
    setAutoSyncLoading(true);
    try {
      const response = await adminAPI.updateDailyExpressionGPTConfig(apiKey.trim(), gptModel);
      if (response.code === 0) {
        setHasAPIKey(true);
        setShowGPTConfig(false);
        setApiKey('');
        message.success('GPT 配置保存成功');
      } else {
        message.error(response.message || '保存 GPT 配置失败');
      }
    } catch (error) {
      console.error('保存 GPT 配置失败:', error);
      message.error('保存 GPT 配置失败，请稍后重试');
    } finally {
      setAutoSyncLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    setSyncLogsLoading(true);
    try {
      const response = await adminAPI.getDailyExpressionSyncLogs({ 
        page: syncLogsPage, 
        page_size: 20 
      });
      if (response.code === 0 && response.data) {
        setSyncLogs(response.data.logs || []);
        setSyncLogsTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载抓取日志失败:', error);
    } finally {
      setSyncLogsLoading(false);
    }
  };

  const handleSyncTimeChange = async (time: dayjs.Dayjs | null) => {
    if (!time) return;
    const timeStr = time.format('HH:mm');
    
    // 先更新本地狀態（立即更新，不等待 API）
    setSyncTime(timeStr);
    
    // 如果自動同步已開啟，立即更新設定
    if (autoSyncEnabled) {
      setAutoSyncLoading(true);
      try {
        const response = await adminAPI.updateDailyExpressionAutoSyncSetting(true, timeStr);
        if (response.code === 0) {
          // 使用響應中的時間（確保與後端一致）
          if (response.data?.sync_time) {
            setSyncTime(response.data.sync_time);
          }
          message.success(`抓取时间已更新为 ${response.data?.sync_time || timeStr}，将在每天 ${response.data?.sync_time || timeStr} 执行`);
        } else {
          message.error(response.message || '更新时间设置失败');
          // 如果更新失敗，恢復原來的時間
          const refreshResponse = await adminAPI.getDailyExpressionAutoSyncSetting();
          if (refreshResponse.code === 0 && refreshResponse.data?.sync_time) {
            setSyncTime(refreshResponse.data.sync_time);
          }
        }
      } catch (error) {
        console.error('更新时间设置失败:', error);
        message.error('更新时间设置失败，请稍后重试');
        // 如果更新失敗，恢復原來的時間
        try {
          const refreshResponse = await adminAPI.getDailyExpressionAutoSyncSetting();
          if (refreshResponse.code === 0 && refreshResponse.data?.sync_time) {
            setSyncTime(refreshResponse.data.sync_time);
          }
        } catch (refreshError) {
          console.error('重新加載設定失敗:', refreshError);
        }
      } finally {
        setAutoSyncLoading(false);
      }
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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">开启每日定时自动{useGPT ? '生成' : '抓取'}一篇文章</span>
              <Switch
                checked={autoSyncEnabled}
                loading={autoSyncLoading}
                onChange={handleToggleAutoSync}
                checkedChildren="已开启"
                unCheckedChildren="已关闭"
              />
              {autoSyncEnabled && (
                <>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-gray-600">执行时间：</span>
                    <TimePicker
                      value={syncTime ? (dayjs(syncTime, 'HH:mm').isValid() ? dayjs(syncTime, 'HH:mm') : dayjs(`2000-01-01 ${syncTime}`, 'YYYY-MM-DD HH:mm')) : dayjs('03:00', 'HH:mm')}
                      onChange={handleSyncTimeChange}
                      format="HH:mm"
                      size="small"
                      style={{ width: 100 }}
                      disabled={autoSyncLoading}
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-gray-600">使用 GPT 生成：</span>
                    <Switch
                      checked={useGPT}
                      loading={autoSyncLoading}
                      onChange={handleToggleGPT}
                      checkedChildren="GPT"
                      unCheckedChildren="抓取"
                      size="small"
                    />
                    {useGPT && !hasAPIKey && (
                      <button
                        onClick={() => setShowGPTConfig(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        配置 API Key
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <Button onClick={handleAdd} icon={<Plus size={16} />}>
              新增文案
            </Button>
          </div>
          
          {/* GPT 配置弹窗 */}
          {showGPTConfig && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">配置 GPT API</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      从 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600">OpenAI Platform</a> 获取 API Key
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GPT 模型
                    </label>
                    <select
                      value={gptModel}
                      onChange={(e) => setGptModel(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo (推荐，成本低)</option>
                      <option value="gpt-4">gpt-4 (质量更高，成本高)</option>
                      <option value="gpt-4-turbo-preview">gpt-4-turbo-preview</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowGPTConfig(false);
                        setApiKey('');
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveGPTConfig}
                      disabled={autoSyncLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'list',
              label: (
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  文案列表
                </span>
              ),
              children: (
                <div>
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
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  抓取详情
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4 text-sm text-gray-600">
                    顯示每天自動抓取的過程和日誌，包括成功、失敗和跳過的記錄
                  </div>
                  <Table
                    columns={[
                      {
                        key: 'created_at',
                        title: '執行時間',
                        dataIndex: 'created_at',
                        width: 180,
                        render: (value: string) => (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" />
                            <span className="text-sm">{value ? format(new Date(value), 'yyyy-MM-dd HH:mm:ss') : '-'}</span>
                          </div>
                        ),
                      },
                      {
                        key: 'sync_date',
                        title: '抓取日期',
                        dataIndex: 'sync_date',
                        width: 120,
                        render: (value: string) => (
                          <span className="font-medium">{value ? format(new Date(value), 'yyyy-MM-dd') : '-'}</span>
                        ),
                      },
                      {
                        key: 'status',
                        title: '狀態',
                        dataIndex: 'status',
                        width: 100,
                        render: (value: string) => {
                          const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
                            success: { label: '成功', color: 'text-green-700', bgColor: 'bg-green-100' },
                            failed: { label: '失敗', color: 'text-red-700', bgColor: 'bg-red-100' },
                            skipped: { label: '跳過', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
                          };
                          const status = statusMap[value] || { label: value, color: 'text-gray-700', bgColor: 'bg-gray-100' };
                          return (
                            <span className={`px-2 py-1 ${status.bgColor} ${status.color} rounded-full text-sm font-medium`}>
                              {status.label}
                            </span>
                          );
                        },
                      },
                      {
                        key: 'source_url',
                        title: '來源網址',
                        dataIndex: 'source_url',
                        width: 250,
                        render: (value: string) => (
                          <span className="text-sm text-gray-600 truncate block" title={value}>
                            {value || '-'}
                          </span>
                        ),
                      },
                      {
                        key: 'title',
                        title: '抓取標題',
                        dataIndex: 'title',
                        render: (value: string) => (
                          <span className="font-medium text-gray-900">{value || '-'}</span>
                        ),
                      },
                      {
                        key: 'duration',
                        title: '耗時',
                        dataIndex: 'duration',
                        width: 100,
                        render: (value: number) => (
                          <span className="text-sm text-gray-500">{value ? `${value}ms` : '-'}</span>
                        ),
                      },
                      {
                        key: 'error_msg',
                        title: '錯誤信息',
                        dataIndex: 'error_msg',
                        width: 300,
                        render: (value: string, record: any) => {
                          if (value) {
                            const colorClass = record.status === 'failed' ? 'text-red-600' : 
                                             record.status === 'skipped' ? 'text-yellow-600' : 
                                             'text-gray-600';
                            return (
                              <div className={`text-sm ${colorClass} max-w-xs truncate`} title={value}>
                                {value}
                              </div>
                            );
                          }
                          return <span className="text-sm text-gray-400">-</span>;
                        },
                      },
                    ]}
                    dataSource={syncLogs}
                    loading={syncLogsLoading}
                    pagination={{
                      current: syncLogsPage,
                      total: syncLogsTotal,
                      pageSize: 20,
                      onChange: setSyncLogsPage,
                    }}
                    rowKey="id"
                  />
                </div>
              ),
            },
          ]}
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
