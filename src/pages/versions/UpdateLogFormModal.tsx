import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import Select from '../../components/form/Select';

interface UpdateLog {
  id: string;
  version_id: string;
  log_type: 'feature' | 'fix' | 'improvement';
  title: string;
  description: string;
  sort_order: number;
}

interface Props {
  visible: boolean;
  item: UpdateLog | null;
  versionId: string;
  onClose: () => void;
}

const UpdateLogFormModal: React.FC<Props> = ({ visible, item, versionId, onClose }) => {
  const [formData, setFormData] = useState({
    log_type: 'feature' as 'feature' | 'fix' | 'improvement',
    title: '',
    description: '',
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        log_type: item.log_type,
        title: item.title,
        description: item.description || '',
        sort_order: item.sort_order || 0,
      });
    } else {
      setFormData({
        log_type: 'feature',
        title: '',
        description: '',
        sort_order: 0,
      });
    }
  }, [item, visible]);

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('请填写标题');
      return;
    }

    setLoading(true);
    try {
      if (item?.id) {
        await adminAPI.updateUpdateLog(item.id, formData);
      } else {
        await adminAPI.createUpdateLog({
          version_id: versionId,
          ...formData,
        });
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
          {item ? '编辑更新日志' : '新建更新日志'}
        </h2>

        <div className="flex-1 overflow-y-auto">
          <FormItem label="类型" required>
            <Select
              value={formData.log_type}
              onChange={(e) => setFormData({ ...formData, log_type: e.target.value as any })}
              options={[
                { value: 'feature', label: '新功能' },
                { value: 'fix', label: '修复' },
                { value: 'improvement', label: '改进' },
              ]}
            />
          </FormItem>

          <FormItem label="标题" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：新增AI对话功能"
            />
          </FormItem>

          <FormItem label="描述">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述"
              rows={4}
            />
          </FormItem>

          <FormItem label="排序">
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">数字越小越靠前</p>
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

export default UpdateLogFormModal;
