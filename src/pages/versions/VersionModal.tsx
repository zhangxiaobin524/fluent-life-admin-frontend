import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import Select from '../../components/form/Select';

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

interface Props {
  visible: boolean;
  item: AppVersion | null;
  onClose: () => void;
}

const VersionModal: React.FC<Props> = ({ visible, item, onClose }) => {
  const [formData, setFormData] = useState({
    version: '',
    version_code: 1,
    platform: 'web',
    update_type: 'normal' as 'force' | 'normal' | 'silent',
    title: '',
    description: '',
    download_url: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        version: item.version,
        version_code: item.version_code,
        platform: item.platform,
        update_type: item.update_type,
        title: item.title,
        description: item.description || '',
        download_url: item.download_url || '',
        is_active: item.is_active,
      });
    } else {
      setFormData({
        version: '',
        version_code: 1,
        platform: 'web',
        update_type: 'normal',
        title: '',
        description: '',
        download_url: '',
        is_active: true,
      });
    }
  }, [item, visible]);

  const handleSubmit = async () => {
    if (!formData.version || !formData.title || formData.version_code <= 0) {
      alert('请填写版本号、标题和版本代码');
      return;
    }

    setLoading(true);
    try {
      if (item?.id) {
        await adminAPI.updateVersion(item.id, formData);
      } else {
        await adminAPI.createVersion(formData);
      }
      onClose();
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold mb-4">
          {item ? '编辑版本' : '新建版本'}
        </h2>

        <div className="flex-1 overflow-y-auto">
          <FormItem label="版本号" required>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="例如：1.0.0"
            />
          </FormItem>

          <FormItem label="版本代码" required>
            <Input
              type="number"
              value={formData.version_code}
              onChange={(e) => setFormData({ ...formData, version_code: parseInt(e.target.value) || 1 })}
              placeholder="例如：1"
            />
            <p className="text-xs text-gray-500 mt-1">版本代码用于比较版本，数字越大版本越新</p>
          </FormItem>

          <FormItem label="平台" required>
            <Select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={[
                { value: 'ios', label: 'iOS' },
                { value: 'android', label: 'Android' },
                { value: 'web', label: 'Web' },
              ]}
            />
          </FormItem>

          <FormItem label="更新类型" required>
            <Select
              value={formData.update_type}
              onChange={(e) => setFormData({ ...formData, update_type: e.target.value as any })}
              options={[
                { value: 'force', label: '强制更新' },
                { value: 'normal', label: '普通更新' },
                { value: 'silent', label: '静默更新' },
              ]}
            />
          </FormItem>

          <FormItem label="标题" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：新版本发布"
            />
          </FormItem>

          <FormItem label="描述">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="版本更新描述"
              rows={4}
            />
          </FormItem>

          <FormItem label="下载链接">
            <Input
              value={formData.download_url}
              onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
              placeholder="例如：https://example.com/download"
            />
          </FormItem>

          <FormItem label="状态">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span>激活</span>
            </label>
          </FormItem>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button onClick={onClose} variant="default">
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VersionModal;
