import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import Select from '../../components/form/Select';

interface FeatureGuide {
  id: string;
  feature_key: string;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  steps?: any;
  platform: string;
  version?: string;
  is_active: boolean;
  sort_order: number;
}

interface Props {
  visible: boolean;
  item: FeatureGuide | null;
  onClose: () => void;
}

const FeatureGuideModal: React.FC<Props> = ({ visible, item, onClose }) => {
  const [formData, setFormData] = useState({
    feature_key: '',
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    steps: '',
    platform: 'all',
    version: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      let stepsStr = '';
      if (item.steps) {
        try {
          if (typeof item.steps === 'string') {
            stepsStr = item.steps;
          } else {
            stepsStr = JSON.stringify(item.steps, null, 2);
          }
        } catch (e) {
          stepsStr = String(item.steps);
        }
      }
      setFormData({
        feature_key: item.feature_key,
        title: item.title,
        description: item.description || '',
        image_url: item.image_url || '',
        video_url: item.video_url || '',
        steps: stepsStr,
        platform: item.platform || 'all',
        version: item.version || '',
        is_active: item.is_active,
        sort_order: item.sort_order || 0,
      });
    } else {
      setFormData({
        feature_key: '',
        title: '',
        description: '',
        image_url: '',
        video_url: '',
        steps: '',
        platform: 'all',
        version: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [item, visible]);

  const handleSubmit = async () => {
    if (!formData.feature_key || !formData.title) {
      alert('请填写功能标识和标题');
      return;
    }

    setLoading(true);
    try {
      let steps: any = null;
      if (formData.steps) {
        try {
          steps = JSON.parse(formData.steps);
        } catch (e) {
          // 如果不是有效JSON，作为字符串数组处理
          steps = formData.steps.split('\n').filter(s => s.trim());
        }
      }

      const data: any = {
        ...formData,
        steps: steps,
      };
      if (item?.id) {
        await adminAPI.updateFeatureGuide(item.id, data);
      } else {
        await adminAPI.createFeatureGuide(data);
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
          {item ? '编辑功能引导' : '新建功能引导'}
        </h2>

        <div className="flex-1 overflow-y-auto">
          <FormItem label="功能标识" required>
            <Input
              value={formData.feature_key}
              onChange={(e) => setFormData({ ...formData, feature_key: e.target.value })}
              placeholder="例如：new_ai_chat"
              disabled={!!item?.id}
            />
            <p className="text-xs text-gray-500 mt-1">功能标识创建后不可修改，使用英文和下划线</p>
          </FormItem>

          <FormItem label="标题" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="引导标题"
            />
          </FormItem>

          <FormItem label="描述">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="功能描述"
              rows={3}
            />
          </FormItem>

          <FormItem label="图片URL">
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FormItem>

          <FormItem label="视频URL">
            <Input
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://example.com/video.mp4"
            />
          </FormItem>

          <FormItem label="引导步骤">
            <Textarea
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              placeholder='JSON格式，例如：["步骤1", "步骤2", "步骤3"] 或每行一个步骤'
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">可以是JSON数组，或每行一个步骤</p>
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="平台">
              <Select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                options={[
                  { value: 'all', label: '全部' },
                  { value: 'ios', label: 'iOS' },
                  { value: 'android', label: 'Android' },
                  { value: 'web', label: 'Web' },
                ]}
              />
            </FormItem>

            <FormItem label="适用版本">
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="例如：1.0.0"
              />
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="排序">
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">数字越小越靠前</p>
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

export default FeatureGuideModal;
