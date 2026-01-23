import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import Select from '../../components/form/Select';

interface Announcement {
  id: string;
  type: 'system' | 'feature' | 'event' | 'maintenance';
  priority: 'high' | 'normal' | 'low';
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  is_pinned: boolean;
  target_users: string;
}

interface Props {
  visible: boolean;
  item: Announcement | null;
  onClose: () => void;
}

const AnnouncementModal: React.FC<Props> = ({ visible, item, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'system' as 'system' | 'feature' | 'event' | 'maintenance',
    priority: 'normal' as 'high' | 'normal' | 'low',
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    start_time: '',
    end_time: '',
    is_active: true,
    is_pinned: false,
    target_users: 'all',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        type: item.type,
        priority: item.priority,
        title: item.title,
        content: item.content,
        image_url: item.image_url || '',
        link_url: item.link_url || '',
        start_time: item.start_time ? item.start_time.split('T')[0] + 'T' + item.start_time.split('T')[1].split('.')[0] : '',
        end_time: item.end_time ? item.end_time.split('T')[0] + 'T' + item.end_time.split('T')[1].split('.')[0] : '',
        is_active: item.is_active,
        is_pinned: item.is_pinned,
        target_users: item.target_users || 'all',
      });
    } else {
      setFormData({
        type: 'system',
        priority: 'normal',
        title: '',
        content: '',
        image_url: '',
        link_url: '',
        start_time: '',
        end_time: '',
        is_active: true,
        is_pinned: false,
        target_users: 'all',
      });
    }
  }, [item, visible]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      alert('请填写标题和内容');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        ...formData,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
      };
      if (item?.id) {
        await adminAPI.updateAnnouncement(item.id, data);
      } else {
        await adminAPI.createAnnouncement(data);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold mb-4">
          {item ? '编辑公告' : '新建公告'}
        </h2>

        <div className="flex-1 overflow-y-auto">
          <FormItem label="类型" required>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: 'system', label: '系统' },
                { value: 'feature', label: '功能' },
                { value: 'event', label: '活动' },
                { value: 'maintenance', label: '维护' },
              ]}
            />
          </FormItem>

          <FormItem label="优先级" required>
            <Select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              options={[
                { value: 'high', label: '高' },
                { value: 'normal', label: '普通' },
                { value: 'low', label: '低' },
              ]}
            />
          </FormItem>

          <FormItem label="标题" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="公告标题"
            />
          </FormItem>

          <FormItem label="内容" required>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="公告内容"
              rows={6}
            />
          </FormItem>

          <FormItem label="图片URL">
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FormItem>

          <FormItem label="跳转链接">
            <Input
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://example.com"
            />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="开始时间">
              <Input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </FormItem>

            <FormItem label="结束时间">
              <Input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </FormItem>
          </div>

          <FormItem label="目标用户">
            <Select
              value={formData.target_users}
              onChange={(e) => setFormData({ ...formData, target_users: e.target.value })}
              options={[
                { value: 'all', label: '所有用户' },
                { value: 'new', label: '新用户' },
                { value: 'vip', label: 'VIP用户' },
              ]}
            />
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
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

            <FormItem label="置顶">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>置顶</span>
              </label>
            </FormItem>
          </div>
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

export default AnnouncementModal;
