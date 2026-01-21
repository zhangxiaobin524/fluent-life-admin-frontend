import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';

interface DailyExpression {
  id?: string;
  title: string;
  content: string;
  tips: string;
  source: string;
  date: string;
  is_active: boolean;
}

interface Props {
  visible: boolean;
  editingItem: DailyExpression | null;
  onClose: () => void;
}

const DailyExpressionModal: React.FC<Props> = ({ visible, editingItem, onClose }) => {
  const [formData, setFormData] = useState<DailyExpression>({
    title: '',
    content: '',
    tips: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        date: editingItem.date ? editingItem.date.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        title: '',
        content: '',
        tips: '',
        source: '',
        date: new Date().toISOString().split('T')[0],
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
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };
      if (editingItem?.id) {
        await adminAPI.updateDailyExpression(editingItem.id, submitData);
      } else {
        await adminAPI.createDailyExpression(submitData);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingItem ? '编辑每日朗诵文案' : '新增每日朗诵文案'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormItem label="标题" required>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入标题"
              />
            </FormItem>

            <FormItem label="来源">
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="如：人民日报"
              />
            </FormItem>
          </div>

          <FormItem label="发布日期" required>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </FormItem>

          <FormItem label="内容" required>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请输入文案内容"
              className="w-full px-3 py-2 border rounded-lg min-h-[200px]"
            />
          </FormItem>

          <FormItem label="朗诵技巧提示">
            <textarea
              value={formData.tips}
              onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
              placeholder="请输入朗诵技巧提示（每行一条，用换行分隔）"
              className="w-full px-3 py-2 border rounded-lg min-h-[120px]"
            />
          </FormItem>

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
          <Button onClick={onClose} variant="secondary">
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

export default DailyExpressionModal;
