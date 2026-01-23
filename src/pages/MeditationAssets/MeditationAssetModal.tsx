import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';

interface MeditationAsset {
  id?: string;
  asset_type: 'image' | 'audio';
  title: string;
  url: string;
  duration?: number | null;
  order: number;
  is_active: boolean;
  linked_audio_id?: string | null;
  linked_audio?: {
    id: string;
    title: string;
  } | null;
}

interface Props {
  visible: boolean;
  editingItem: MeditationAsset | null;
  onClose: () => void;
}

const MeditationAssetModal: React.FC<Props> = ({ visible, editingItem, onClose }) => {
  const [formData, setFormData] = useState<MeditationAsset>({
    asset_type: 'image',
    title: '',
    url: '',
    duration: undefined,
    order: 0,
    is_active: true,
    linked_audio_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioOptions, setAudioOptions] = useState<Array<{id: string; title: string}>>([]);
  const [loadingAudios, setLoadingAudios] = useState(false);

  // 加载音频列表（用于图片关联）
  useEffect(() => {
    if (visible && formData.asset_type === 'image') {
      loadAudioOptions();
    }
  }, [visible, formData.asset_type]);

  const loadAudioOptions = async () => {
    setLoadingAudios(true);
    try {
      const res = await adminAPI.getMeditationAssets({ asset_type: 'audio', is_active: 'true' });
      if (res.code === 0 && res.data?.assets) {
        setAudioOptions(res.data.assets.map((a: any) => ({ id: a.id, title: a.title })));
      }
    } catch (error) {
      console.error('加载音频列表失败:', error);
    } finally {
      setLoadingAudios(false);
    }
  };

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        duration: editingItem.duration ?? undefined,
        linked_audio_id: editingItem.linked_audio_id || null,
      });
      setSelectedFile(null);
    } else {
      setFormData({
        asset_type: 'image',
        title: '',
        url: '',
        duration: undefined,
        order: 0,
        is_active: true,
        linked_audio_id: null,
      });
      setSelectedFile(null);
    }
  }, [editingItem, visible]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 如果上传文件，清空URL输入
      if (!editingItem) {
        setFormData({ ...formData, url: '' });
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('请填写标题');
      return;
    }

    // 如果没有上传文件且没有URL，提示错误
    if (!selectedFile && !formData.url.trim()) {
      alert('请上传文件或填写资源链接');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        asset_type: formData.asset_type,
        title: formData.title.trim(),
        order: formData.order,
        is_active: formData.is_active,
      };

      // 如果是图片类型，添加关联的音频ID
      if (formData.asset_type === 'image' && formData.linked_audio_id) {
        payload.linked_audio_id = formData.linked_audio_id;
      }

      // 如果是音频类型，添加时长
      if (formData.asset_type === 'audio') {
        if (formData.duration) {
          payload.duration = Number(formData.duration);
        } else {
          payload.duration = null;
        }
      }

      // 如果有文件上传，使用文件上传；否则使用URL
      if (selectedFile) {
        payload.url = ''; // 文件上传时不需要URL
      } else {
        payload.url = formData.url.trim();
      }

      if (editingItem?.id) {
        await adminAPI.updateMeditationAsset(editingItem.id, payload);
      } else {
        await adminAPI.createMeditationAsset(payload, selectedFile || undefined);
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
          {editingItem ? '编辑冥想资源' : '新增冥想资源'}
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

            <FormItem label="资源类型" required>
              <select
                value={formData.asset_type}
                onChange={(e) => {
                  const newType = e.target.value as 'image' | 'audio';
                  setFormData({
                    ...formData,
                    asset_type: newType,
                    linked_audio_id: newType === 'audio' ? null : formData.linked_audio_id,
                  });
                  if (newType === 'image') {
                    loadAudioOptions();
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="image">图片</option>
                <option value="audio">音频</option>
              </select>
            </FormItem>
          </div>

          {/* 文件上传 */}
          <FormItem label={editingItem ? "更新文件（可选）" : "上传文件"}>
            <input
              type="file"
              accept={formData.asset_type === 'image' ? 'image/*' : 'audio/*'}
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-1">已选择: {selectedFile.name}</p>
            )}
          </FormItem>

          {/* 资源链接（如果没有上传文件） */}
          {!selectedFile && (
            <FormItem label={editingItem ? "资源链接（留空则使用原链接）" : "资源链接"} required={!editingItem}>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={editingItem ? "留空则使用原链接" : "请输入资源的完整链接"}
              />
              <p className="text-xs text-gray-500 mt-1">
                {editingItem ? "提示：上传文件或填写新链接来更新资源" : "提示：可以上传文件（推荐）或填写链接"}
              </p>
            </FormItem>
          )}

          {/* 图片类型：关联背景音乐 */}
          {formData.asset_type === 'image' && (
            <FormItem label="关联背景音乐">
              {loadingAudios ? (
                <p className="text-sm text-gray-500">加载中...</p>
              ) : (
                <select
                  value={formData.linked_audio_id || ''}
                  onChange={(e) => setFormData({ ...formData, linked_audio_id: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">无（不关联）</option>
                  {audioOptions.map((audio) => (
                    <option key={audio.id} value={audio.id}>
                      {audio.title}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                选择与此背景图片关联的背景音乐，用户选择此图片时会自动播放对应音乐
              </p>
            </FormItem>
          )}

          {/* 音频类型：时长 */}
          {formData.asset_type === 'audio' && (
            <FormItem label="音频时长（秒）">
              <Input
                type="number"
                min={0}
                value={formData.duration ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="请输入音频时长"
              />
            </FormItem>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormItem label="排序">
              <Input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: Number(e.target.value),
                  })
                }
                placeholder="数字越小越靠前"
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

export default MeditationAssetModal;
