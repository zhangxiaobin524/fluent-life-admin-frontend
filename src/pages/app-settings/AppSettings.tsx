import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import { Plus, Edit, Trash2, Settings, Power, AlertTriangle, CreditCard, TestTube, Save } from 'lucide-react';
import AppSettingModal from './AppSettingModal';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const AppSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AppSetting | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'features' | 'maintenance' | 'payment'>('settings');
  
  // 支付配置相关状态
  const [paymentConfig, setPaymentConfig] = useState<any>({
    is_enabled: true,
    alipay_is_production: false,
    wechat_is_production: false,
  });
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    if (activeTab === 'payment') {
      loadPaymentConfig();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAppSettings();
      if (response.code === 0 && response.data) {
        setSettings(response.data.settings || []);
      }
    } catch (error) {
      console.error('加载应用设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: AppSetting) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个设置吗？')) return;
    try {
      await adminAPI.deleteAppSetting(id);
      loadSettings();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingItem(null);
    loadSettings();
  };

  const columns = [
    {
      key: 'key',
      title: '键名',
      dataIndex: 'key' as keyof AppSetting,
      render: (value: string) => (
        <span className="font-mono text-sm font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'value',
      title: '值',
      dataIndex: 'value' as keyof AppSetting,
      render: (value: string) => (
        <span className="text-sm text-gray-700 max-w-md truncate block" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: 'description',
      title: '描述',
      dataIndex: 'description' as keyof AppSetting,
      render: (value: string) => value || <span className="text-gray-400">-</span>,
    },
    {
      key: 'updated_at',
      title: '更新时间',
      dataIndex: 'updated_at' as keyof AppSetting,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, item: AppSetting) => (
        <div className="flex gap-2">
          <Button
            variant="default"
            size="small"
            onClick={() => handleEdit(item)}
            className="text-green-600 hover:text-green-700"
          >
            <Edit className="w-4 h-4 mr-1" />
            编辑
          </Button>
          <Button
            variant="default"
            size="small"
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            删除
          </Button>
        </div>
      ),
    },
  ];

  // 功能开关列表
  const featureSwitches = [
    { key: 'feature_ai_conversation', label: 'AI对话功能', description: '启用/禁用AI对话功能' },
    { key: 'feature_community', label: '社区功能', description: '启用/禁用社区发帖、评论等功能' },
    { key: 'feature_training', label: '训练功能', description: '启用/禁用训练中心功能' },
    { key: 'feature_payment', label: '支付功能', description: '启用/禁用支付订阅功能' },
    { key: 'feature_share', label: '分享功能', description: '启用/禁用分享功能' },
  ];

  // 维护模式设置
  const maintenanceMode = settings.find(s => s.key === 'maintenance_mode');
  const maintenanceMessage = settings.find(s => s.key === 'maintenance_message');

  const toggleFeature = async (key: string, enabled: boolean) => {
    try {
      const existing = settings.find(s => s.key === key);
      if (existing) {
        await adminAPI.updateAppSetting(existing.id, { value: enabled ? 'true' : 'false' });
      } else {
        await adminAPI.createAppSetting({
          key,
          value: enabled ? 'true' : 'false',
          description: featureSwitches.find(f => f.key === key)?.description || '',
        });
      }
      loadSettings();
    } catch (error) {
      console.error('更新功能开关失败:', error);
      alert('更新失败，请重试');
    }
  };

  const toggleMaintenanceMode = async (enabled: boolean) => {
    try {
      if (maintenanceMode) {
        await adminAPI.updateAppSetting(maintenanceMode.id, { value: enabled ? 'true' : 'false' });
      } else {
        await adminAPI.createAppSetting({
          key: 'maintenance_mode',
          value: enabled ? 'true' : 'false',
          description: '系统维护模式开关',
        });
      }
      loadSettings();
    } catch (error) {
      console.error('更新维护模式失败:', error);
      alert('更新失败，请重试');
    }
  };

  const updateMaintenanceMessage = async (message: string) => {
    try {
      if (maintenanceMessage) {
        await adminAPI.updateAppSetting(maintenanceMessage.id, { value: message });
      } else {
        await adminAPI.createAppSetting({
          key: 'maintenance_message',
          value: message,
          description: '维护模式提示信息',
        });
      }
      loadSettings();
    } catch (error) {
      console.error('更新维护信息失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 支付配置相关函数
  const loadPaymentConfig = async () => {
    setPaymentConfigLoading(true);
    try {
      const response = await adminAPI.getPaymentConfig();
      if (response.code === 0 && response.data) {
        setPaymentConfig(response.data);
      }
    } catch (error) {
      console.error('加载支付配置失败:', error);
    } finally {
      setPaymentConfigLoading(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    setPaymentSaving(true);
    try {
      const response = await adminAPI.createOrUpdatePaymentConfig(paymentConfig);
      if (response.code === 0) {
        alert('保存成功！');
        loadPaymentConfig();
      } else {
        alert(response.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleTestPayment = async (type: 'alipay' | 'wechat') => {
    try {
      const response = await adminAPI.testPaymentConfig(type);
      if (response.code === 0 && response.data) {
        if (response.data.is_valid) {
          alert(`✅ ${response.data.message}`);
        } else {
          alert(`❌ ${response.data.message}`);
        }
      }
    } catch (error: any) {
      console.error('测试失败:', error);
      alert(error.response?.data?.message || '测试失败，请重试');
    }
  };

  const updatePaymentField = (field: string, value: any) => {
    setPaymentConfig({ ...paymentConfig, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统配置管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理系统配置、功能开关和维护模式</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增设置
        </Button>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            系统设置
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Power className="w-4 h-4" />
            功能开关
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            维护模式
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            支付配置
          </button>
        </nav>
      </div>

      {/* 系统设置标签页 */}
      {activeTab === 'settings' && (
        <Card>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>提示：</strong>常用键名包括：<code>app_version</code>（版本号）、<code>about_us</code>（关于我们）、<code>release_notes</code>（更新说明）、<code>customer_service_email</code>（客服邮箱）等
            </p>
          </div>
          <Table
            columns={columns}
            dataSource={settings}
            loading={loading}
          />
        </Card>
      )}

      {/* 功能开关标签页 */}
      {activeTab === 'features' && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">功能开关管理</h3>
            {featureSwitches.map((feature) => {
              const setting = settings.find(s => s.key === feature.key);
              const enabled = setting?.value === 'true';
              return (
                <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{feature.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{feature.description}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => toggleFeature(feature.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 维护模式标签页 */}
      {activeTab === 'maintenance' && (
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">维护模式设置</h3>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">维护模式</div>
                  <div className="text-sm text-gray-500 mt-1">
                    启用后，用户将看到维护提示信息，无法正常使用系统
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode?.value === 'true'}
                    onChange={(e) => toggleMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                维护提示信息
              </label>
              <textarea
                value={maintenanceMessage?.value || ''}
                onChange={(e) => updateMaintenanceMessage(e.target.value)}
                placeholder="请输入维护提示信息，例如：系统正在维护中，预计30分钟后恢复..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                此信息将在维护模式下显示给用户
              </p>
            </div>

            {maintenanceMode?.value === 'true' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                  <div>
                    <div className="font-medium text-yellow-800">维护模式已启用</div>
                    <div className="text-sm text-yellow-700 mt-1">
                      用户将无法正常使用系统，请尽快完成维护并关闭维护模式
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 支付配置标签页 */}
      {activeTab === 'payment' && (
        <Card>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">支付配置管理</h3>
                <p className="text-sm text-gray-500 mt-1">配置支付宝和微信支付参数</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                onClick={() => handleTestPayment('alipay')}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                测试支付宝
              </Button>
              <Button
                variant="default"
                onClick={() => handleTestPayment('wechat')}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                测试微信
              </Button>
              <Button onClick={handleSavePaymentConfig} disabled={paymentSaving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Save className="w-4 h-4" />
                {paymentSaving ? '保存中...' : '保存配置'}
              </Button>
            </div>
          </div>

          {paymentConfigLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-6">
              {/* 通用设置 */}
              <div className="border-b pb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">通用设置</h4>
                <FormItem label="支付回调地址" required>
                  <Input
                    value={paymentConfig.callback_url || ''}
                    onChange={(e) => updatePaymentField('callback_url', e.target.value)}
                    placeholder="http://yourdomain.com/api/v1/payment/callback"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    支付完成后，支付平台会回调此地址通知支付结果
                  </p>
                </FormItem>
                <FormItem label="启用支付功能">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.is_enabled !== false}
                      onChange={(e) => updatePaymentField('is_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-700">
                      {paymentConfig.is_enabled !== false ? '已启用' : '已禁用'}
                    </span>
                  </label>
                </FormItem>
              </div>

              {/* 支付宝配置 */}
              <div className="border-b pb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-4">支付宝配置</h4>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <strong>配置说明：</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>AppID：从支付宝开放平台获取</li>
                        <li>应用私钥：RSA2格式，用于签名</li>
                        <li>支付宝公钥：用于验证回调签名</li>
                        <li>环境：测试环境使用沙箱，生产环境使用正式环境</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormItem label="支付宝AppID" required>
                    <Input
                      value={paymentConfig.alipay_app_id || ''}
                      onChange={(e) => updatePaymentField('alipay_app_id', e.target.value)}
                      placeholder="例如：2021001234567890"
                    />
                  </FormItem>
                  <FormItem label="环境设置">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.alipay_is_production === true}
                        onChange={(e) => updatePaymentField('alipay_is_production', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm text-gray-700">
                        {paymentConfig.alipay_is_production ? '正式环境' : '沙箱环境（测试）'}
                      </span>
                    </label>
                  </FormItem>
                </div>
                <FormItem label="应用私钥" required>
                  <Textarea
                    value={paymentConfig.alipay_private_key || ''}
                    onChange={(e) => updatePaymentField('alipay_private_key', e.target.value)}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                    rows={6}
                    className="font-mono text-xs"
                  />
                </FormItem>
                <FormItem label="支付宝公钥" required>
                  <Textarea
                    value={paymentConfig.alipay_public_key || ''}
                    onChange={(e) => updatePaymentField('alipay_public_key', e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                    rows={5}
                    className="font-mono text-xs"
                  />
                </FormItem>
              </div>

              {/* 微信支付配置 */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">微信支付配置</h4>
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                    <div className="text-sm text-green-800">
                      <strong>配置说明：</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>AppID：小程序或公众号的AppID</li>
                        <li>商户号：微信支付商户号</li>
                        <li>API密钥：32位字符串，用于签名和加密</li>
                        <li>证书路径和私钥路径：文件系统路径</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormItem label="微信AppID" required>
                    <Input
                      value={paymentConfig.wechat_app_id || ''}
                      onChange={(e) => updatePaymentField('wechat_app_id', e.target.value)}
                      placeholder="例如：wx1234567890abcdef"
                    />
                  </FormItem>
                  <FormItem label="商户号（MchID）" required>
                    <Input
                      value={paymentConfig.wechat_mch_id || ''}
                      onChange={(e) => updatePaymentField('wechat_mch_id', e.target.value)}
                      placeholder="例如：1234567890"
                    />
                  </FormItem>
                  <FormItem label="API密钥" required>
                    <Input
                      type="password"
                      value={paymentConfig.wechat_api_key || ''}
                      onChange={(e) => updatePaymentField('wechat_api_key', e.target.value)}
                      placeholder="32位字符串"
                    />
                  </FormItem>
                  <FormItem label="环境设置">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.wechat_is_production === true}
                        onChange={(e) => updatePaymentField('wechat_is_production', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm text-gray-700">
                        {paymentConfig.wechat_is_production ? '正式环境' : '沙箱环境（测试）'}
                      </span>
                    </label>
                  </FormItem>
                  <FormItem label="商户证书路径">
                    <Input
                      value={paymentConfig.wechat_cert_path || ''}
                      onChange={(e) => updatePaymentField('wechat_cert_path', e.target.value)}
                      placeholder="/path/to/cert.pem"
                    />
                  </FormItem>
                  <FormItem label="商户私钥路径" required>
                    <Input
                      value={paymentConfig.wechat_key_path || ''}
                      onChange={(e) => updatePaymentField('wechat_key_path', e.target.value)}
                      placeholder="/path/to/key.pem"
                    />
                  </FormItem>
                  <FormItem label="证书序列号">
                    <Input
                      value={paymentConfig.wechat_cert_serial_no || ''}
                      onChange={(e) => updatePaymentField('wechat_cert_serial_no', e.target.value)}
                      placeholder="从证书中提取或手动填写"
                    />
                  </FormItem>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {modalVisible && (
        <AppSettingModal
          visible={modalVisible}
          editingItem={editingItem}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default AppSettings;
