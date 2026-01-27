import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import { Save, TestTube, AlertCircle, CreditCard } from 'lucide-react';

interface PaymentConfig {
  id?: string;
  callback_url?: string;
  alipay_app_id?: string;
  alipay_private_key?: string;
  alipay_public_key?: string;
  alipay_is_production?: boolean;
  wechat_app_id?: string;
  wechat_mch_id?: string;
  wechat_api_key?: string;
  wechat_cert_path?: string;
  wechat_key_path?: string;
  wechat_cert_serial_no?: string;
  wechat_is_production?: boolean;
  is_enabled?: boolean;
}

const PaymentConfig: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig>({
    is_enabled: true,
    alipay_is_production: false,
    wechat_is_production: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'alipay' | 'wechat' | 'general'>('general');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPaymentConfig();
      if (response.code === 0 && response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('加载支付配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await adminAPI.createOrUpdatePaymentConfig(config);
      if (response.code === 0) {
        alert('保存成功！');
        loadConfig();
      } else {
        alert(response.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (type: 'alipay' | 'wechat') => {
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

  const updateField = (field: keyof PaymentConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            支付配置管理
          </h1>
          <p className="mt-1 text-sm text-gray-500">配置支付宝和微信支付参数</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => handleTest('alipay')}
            className="flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            测试支付宝
          </Button>
          <Button
            variant="default"
            onClick={() => handleTest('wechat')}
            className="flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            测试微信支付
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            通用设置
          </button>
          <button
            onClick={() => setActiveTab('alipay')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'alipay'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            支付宝配置
          </button>
          <button
            onClick={() => setActiveTab('wechat')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'wechat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            微信支付配置
          </button>
        </nav>
      </div>

      {/* 通用设置 */}
      {activeTab === 'general' && (
        <Card>
          <div className="space-y-4">
            <FormItem label="支付回调地址" required>
              <Input
                value={config.callback_url || ''}
                onChange={(e) => updateField('callback_url', e.target.value)}
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
                  checked={config.is_enabled !== false}
                  onChange={(e) => updateField('is_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm text-gray-700">
                  {config.is_enabled !== false ? '已启用' : '已禁用'}
                </span>
              </label>
            </FormItem>
          </div>
        </Card>
      )}

      {/* 支付宝配置 */}
      {activeTab === 'alipay' && (
        <Card>
          <div className="space-y-4">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
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

            <FormItem label="支付宝AppID" required>
              <Input
                value={config.alipay_app_id || ''}
                onChange={(e) => updateField('alipay_app_id', e.target.value)}
                placeholder="例如：2021001234567890"
              />
            </FormItem>

            <FormItem label="应用私钥" required>
              <Textarea
                value={config.alipay_private_key || ''}
                onChange={(e) => updateField('alipay_private_key', e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-500 mt-1">RSA2格式私钥，包含完整的BEGIN和END标记</p>
            </FormItem>

            <FormItem label="支付宝公钥" required>
              <Textarea
                value={config.alipay_public_key || ''}
                onChange={(e) => updateField('alipay_public_key', e.target.value)}
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-500 mt-1">用于验证支付宝回调的签名</p>
            </FormItem>

            <FormItem label="环境设置">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.alipay_is_production === true}
                  onChange={(e) => updateField('alipay_is_production', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm text-gray-700">
                  {config.alipay_is_production ? '正式环境' : '沙箱环境（测试）'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                测试时使用沙箱环境，正式上线后切换到正式环境
              </p>
            </FormItem>
          </div>
        </Card>
      )}

      {/* 微信支付配置 */}
      {activeTab === 'wechat' && (
        <Card>
          <div className="space-y-4">
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                <div className="text-sm text-green-800">
                  <strong>配置说明：</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>AppID：小程序或公众号的AppID</li>
                    <li>商户号：微信支付商户号</li>
                    <li>API密钥：32位字符串，用于签名和加密</li>
                    <li>证书路径：商户证书文件路径（可选）</li>
                    <li>私钥路径：商户私钥文件路径（必需）</li>
                    <li>证书序列号：从证书中提取或配置文件中设置</li>
                  </ul>
                </div>
              </div>
            </div>

            <FormItem label="微信AppID" required>
              <Input
                value={config.wechat_app_id || ''}
                onChange={(e) => updateField('wechat_app_id', e.target.value)}
                placeholder="例如：wx1234567890abcdef"
              />
            </FormItem>

            <FormItem label="商户号（MchID）" required>
              <Input
                value={config.wechat_mch_id || ''}
                onChange={(e) => updateField('wechat_mch_id', e.target.value)}
                placeholder="例如：1234567890"
              />
            </FormItem>

            <FormItem label="API密钥" required>
              <Input
                type="password"
                value={config.wechat_api_key || ''}
                onChange={(e) => updateField('wechat_api_key', e.target.value)}
                placeholder="32位字符串"
              />
              <p className="text-xs text-gray-500 mt-1">32位字符串，用于签名和加密</p>
            </FormItem>

            <FormItem label="商户证书路径">
              <Input
                value={config.wechat_cert_path || ''}
                onChange={(e) => updateField('wechat_cert_path', e.target.value)}
                placeholder="/path/to/cert.pem"
              />
              <p className="text-xs text-gray-500 mt-1">可选，用于退款等操作</p>
            </FormItem>

            <FormItem label="商户私钥路径" required>
              <Input
                value={config.wechat_key_path || ''}
                onChange={(e) => updateField('wechat_key_path', e.target.value)}
                placeholder="/path/to/key.pem"
              />
              <p className="text-xs text-gray-500 mt-1">必需，用于签名</p>
            </FormItem>

            <FormItem label="证书序列号">
              <Input
                value={config.wechat_cert_serial_no || ''}
                onChange={(e) => updateField('wechat_cert_serial_no', e.target.value)}
                placeholder="从证书中提取或手动填写"
              />
              <p className="text-xs text-gray-500 mt-1">
                如果未填写，系统会尝试从证书文件中读取
              </p>
            </FormItem>

            <FormItem label="环境设置">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.wechat_is_production === true}
                  onChange={(e) => updateField('wechat_is_production', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm text-gray-700">
                  {config.wechat_is_production ? '正式环境' : '沙箱环境（测试）'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                测试时使用沙箱环境，正式上线后切换到正式环境
              </p>
            </FormItem>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentConfig;
