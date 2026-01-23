import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Select from '../../components/form/Select';

interface TongueTwister {
  id?: string;
  title: string;
  content: string;
  tips: string;
  level: 'basic' | 'intermediate' | 'advanced';
  order: number;
  is_active: boolean;
}

interface Props {
  visible: boolean;
  editingItem: TongueTwister | null;
  onClose: () => void;
}

const TongueTwisterModal: React.FC<Props> = ({ visible, editingItem, onClose }) => {
  const [formData, setFormData] = useState<TongueTwister>({
    title: '',
    content: '',
    tips: '',
    level: 'basic',
    order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      setFormData({
        title: '',
        content: '',
        tips: '',
        level: 'basic',
        order: 0,
        is_active: true,
      });
    }
  }, [editingItem, visible]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      alert('请填写标题和内容');
      return;
    }

    setLoading(true);
    try {
      if (editingItem?.id) {
        await adminAPI.updateTongueTwister(editingItem.id, formData);
      } else {
        await adminAPI.createTongueTwister(formData);
      }
      onClose();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingItem ? '编辑绕口令' : '新增绕口令'}
        </h2>

        <div className="space-y-4">
          <FormItem label="标题" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入标题"
            />
          </FormItem>

          <FormItem label="内容" required>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请输入绕口令内容"
              className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
            />
          </FormItem>

          <FormItem label="练习提示">
            <textarea
              value={formData.tips}
              onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
              placeholder="请输入练习提示"
              className="w-full px-3 py-2 border rounded-lg min-h-[80px]"
            />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="难度" required>
              <Select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                options={[
                  { value: 'basic', label: '基础' },
                  { value: 'intermediate', label: '进阶' },
                  { value: 'advanced', label: '高级' },
                ]}
              />
            </FormItem>

            <FormItem label="排序">
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="排序值，数字越小越靠前"
              />
            </FormItem>
          </div>

          <FormItem label="状态">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>启用</span>
            </label>
          </FormItem>
        </div>

        <div className="mt-6 flex justify-end gap-4">
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

export default TongueTwisterModal;
