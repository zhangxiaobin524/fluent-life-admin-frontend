import React, { useEffect, useState, useRef } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2, Link as LinkIcon, Image as ImageIcon, Music, Play, Pause, X, ZoomIn } from 'lucide-react';
import { Switch, message } from 'antd';
import { format } from 'date-fns';
import MeditationAssetModal from './MeditationAssetModal';

interface MeditationAsset {
  id: string;
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
  created_at: string;
  updated_at: string;
}

const MeditationAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<MeditationAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [assetType, setAssetType] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'audio'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MeditationAsset | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    loadAssets();
  }, [page, keyword, assetType, activeFilter]);

  // 當標籤切換時，更新 assetType 篩選
  useEffect(() => {
    if (activeTab === 'all') {
      setAssetType('');
    } else {
      setAssetType(activeTab);
    }
    setPage(1); // 切換標籤時重置到第一頁
  }, [activeTab]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: 20,
      };
      if (keyword) params.keyword = keyword.trim();
      if (assetType) params.asset_type = assetType;
      if (activeFilter) params.is_active = activeFilter;

      const res = await adminAPI.getMeditationAssets(params);
      if (res.code === 0 && res.data) {
        setAssets(res.data.assets || []);
        setTotal(res.data.total || 0);
        // 清理已删除的勾选
        setSelectedIds((prev) => prev.filter((id) => (res.data.assets || []).some((a: MeditationAsset) => a.id === id)));
      }
    } catch (error) {
      console.error('加载冥想资源失败:', error);
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleEdit = (item: MeditationAsset) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`确定要删除选中的${ids.length}个资源吗？此操作不可恢复！`)) return;

    try {
      if (ids.length === 1) {
        const res = await adminAPI.deleteMeditationAsset(ids[0]);
        if (res.code !== 0) {
          message.error(res.message || '删除失败');
          return;
        }
      } else {
        const res = await adminAPI.deleteMeditationAssetsBatch(ids);
        if (res.code !== 0) {
          message.error(res.message || '删除失败');
          return;
        }
      }
      message.success('删除成功');
      setSelectedIds([]);
      loadAssets();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败，请稍后重试');
    }
  };

  const handleToggleActive = async (record: MeditationAsset, active: boolean) => {
    try {
      const payload = {
        asset_type: record.asset_type,
        title: record.title,
        url: record.url,
        duration: record.duration,
        order: record.order,
        is_active: active,
      };
      const res = await adminAPI.updateMeditationAsset(record.id, payload);
      if (res.code === 0) {
        message.success('状态更新成功');
        loadAssets();
      } else {
        message.error(res.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('状态更新失败，请稍后重试');
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(assets.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, id]));
      }
      return prev.filter((item) => item !== id);
    });
  };

  // 處理 URL（將相對路徑轉換為完整 URL）
  const getFullUrl = (url: string): string => {
    if (!url) return '';
    
    // 如果已經是完整 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 如果是相對路徑（以 / 開頭），拼接當前域名
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    // 其他情況（可能是相對路徑但沒有 /），嘗試拼接
    // 但這種情況較少見，先返回原 URL
    return url;
  };

  // 圖片預覽
  const handlePreviewImage = (url: string) => {
    setPreviewImage(getFullUrl(url));
  };

  // ESC 鍵關閉預覽
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [previewImage]);

  // 音頻播放控制
  const handleToggleAudio = (record: MeditationAsset) => {
    const audioId = record.id;
    
    // 如果正在播放這個音頻，則暫停
    if (playingAudioId === audioId) {
      const audio = audioRefs.current[audioId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingAudioId(null);
      return;
    }

    // 停止其他正在播放的音頻
    if (playingAudioId) {
      const prevAudio = audioRefs.current[playingAudioId];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    // 播放新的音頻
    const fullUrl = getFullUrl(record.url);
    if (!fullUrl) {
      message.error('音頻 URL 無效');
      return;
    }
    
    // 先測試 URL 是否可訪問
    fetch(fullUrl, { method: 'HEAD', mode: 'no-cors' }).catch(() => {
      // 即使 CORS 失敗也不影響，因為音頻元素可以跨域加載
    });
    
    let audio = audioRefs.current[audioId];
    if (!audio) {
      audio = new Audio();
      audioRefs.current[audioId] = audio;
      
      // 設置音頻屬性
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous'; // 允許跨域
      
      audio.addEventListener('ended', () => {
        setPlayingAudioId(null);
      });
      
      audio.addEventListener('error', (e) => {
        const audioEl = e.target as HTMLAudioElement;
        console.error('音頻播放錯誤:', {
          error: e,
          url: fullUrl,
          originalUrl: record.url,
          networkState: audioEl.networkState,
          readyState: audioEl.readyState,
          errorCode: audioEl.error?.code,
          errorMessage: audioEl.error?.message
        });
        
        let errorMsg = '音頻播放失敗';
        if (audioEl.error) {
          // MediaError 錯誤代碼常量
          const MEDIA_ERR_ABORTED = 1;
          const MEDIA_ERR_NETWORK = 2;
          const MEDIA_ERR_DECODE = 3;
          const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
          
          switch (audioEl.error.code) {
            case MEDIA_ERR_ABORTED:
              errorMsg = '音頻加載被中止';
              break;
            case MEDIA_ERR_NETWORK:
              errorMsg = '網絡錯誤，無法加載音頻';
              break;
            case MEDIA_ERR_DECODE:
              errorMsg = '音頻解碼失敗，格式可能不支持';
              break;
            case MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = '音頻格式不支持或 URL 無效';
              break;
            default:
              errorMsg = `音頻播放失敗 (錯誤代碼: ${audioEl.error.code})`;
          }
        }
        
        message.error(`${errorMsg}: ${record.url}`);
        setPlayingAudioId(null);
      });
      
      audio.addEventListener('loadstart', () => {
        console.log('開始加載音頻:', fullUrl);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('音頻可以播放:', fullUrl);
      });
      
      audio.src = fullUrl;
    } else {
      // 如果音頻已存在但 URL 可能已改變，更新 src
      if (audio.src !== fullUrl && !audio.src.endsWith(fullUrl)) {
        audio.src = fullUrl;
        // 重新加載音頻
        audio.load();
      }
    }
    
    audio.play().catch((error) => {
      console.error('播放音頻失敗:', {
        error,
        url: fullUrl,
        originalUrl: record.url,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
      message.error(`播放失敗: ${error.message || '請檢查音頻鏈接是否有效'}`);
      setPlayingAudioId(null);
    });
    
    setPlayingAudioId(audioId);
  };

  // 清理音頻資源（組件卸載時）
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = '';
        audio.removeEventListener('ended', () => {});
        audio.removeEventListener('error', () => {});
      });
      audioRefs.current = {};
      setPlayingAudioId(null);
    };
  }, []);

  // 當頁面切換或資源列表變化時，停止播放
  useEffect(() => {
    if (playingAudioId && !assets.find(a => a.id === playingAudioId)) {
      const audio = audioRefs.current[playingAudioId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingAudioId(null);
    }
  }, [assets, playingAudioId]);

  const columns = [
      {
        key: 'select',
        title: (
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === assets.length}
            onChange={(e) => toggleSelectAll(e.target.checked)}
          />
        ),
        render: (_: any, record: MeditationAsset) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(record.id)}
            onChange={(e) => toggleSelect(record.id, e.target.checked)}
          />
        ),
        align: 'center' as const,
      },
      {
        key: 'title',
        title: '标题',
        dataIndex: 'title' as const,
        render: (value: string, record: MeditationAsset) => (
          <div className="max-w-xs">
            <div className="font-semibold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 truncate">{record.url}</div>
            {/* 圖片縮略圖預覽 */}
            {record.asset_type === 'image' && (
              <div 
                className="mt-2 relative group cursor-pointer"
                onClick={() => handlePreviewImage(record.url)}
              >
                <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-100">
                  <img
                    src={getFullUrl(record.url)}
                    alt={value}
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">圖片加載失敗</div>';
                      }
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all">
                  <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
            {/* 音頻播放預覽 */}
            {record.asset_type === 'audio' && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleToggleAudio(record)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                >
                  {playingAudioId === record.id ? (
                    <>
                      <Pause size={12} />
                      暫停
                    </>
                  ) : (
                    <>
                      <Play size={12} />
                      播放
                    </>
                  )}
                </button>
                <span className="text-xs text-gray-400">
                  {record.duration ? `${record.duration}秒` : '未知時長'}
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'asset_type',
        title: '类型',
        dataIndex: 'asset_type' as const,
        render: (value: string, record: MeditationAsset) => (
          <div className="flex items-center gap-1">
            {value === 'image' ? <ImageIcon size={16} /> : <Music size={16} />}
            <span>{value === 'image' ? '图片' : '音频'}</span>
            {value === 'image' && record.linked_audio && (
              <span className="text-xs text-gray-500 ml-2">
                (关联: {record.linked_audio.title})
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'duration',
        title: '时长/排序',
        render: (_: any, record: MeditationAsset) => (
          <div className="text-sm text-gray-700">
            {record.asset_type === 'audio' ? (
              <div>时长: {record.duration ? `${record.duration}s` : '-'}</div>
            ) : (
              <div>时长: -</div>
            )}
            <div className="text-gray-500">排序: {record.order ?? 0}</div>
          </div>
        ),
      },
      {
        key: 'status',
        title: '状态',
        dataIndex: 'is_active' as const,
        render: (value: boolean, record: MeditationAsset) => (
          <Switch checked={value} onChange={(checked) => handleToggleActive(record, checked)} />
        ),
        align: 'center' as const,
      },
      {
        key: 'created_at',
        title: '创建时间',
        dataIndex: 'created_at' as const,
        render: (value: string) => {
          try {
            return format(new Date(value), 'yyyy-MM-dd HH:mm');
          } catch {
            return value;
          }
        },
      },
      {
        key: 'actions',
        title: '操作',
        render: (_: any, record: MeditationAsset) => (
          <div className="flex gap-3 items-center">
            <a href={record.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <LinkIcon size={16} />
              查看
            </a>
            <button onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Edit size={16} />
              编辑
            </button>
            <button
              onClick={() => handleDelete([record.id])}
              className="text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <Trash2 size={16} />
              删除
            </button>
          </div>
        ),
      },
    ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">冥想资源管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理冥想背景图、背景音乐资源。</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <Button variant="default" onClick={() => handleDelete(selectedIds)} icon={<Trash2 size={16} />}>
                批量删除
              </Button>
            )}
            <Button onClick={handleAdd} icon={<Plus size={16} />}>
              新增资源
            </Button>
          </div>
        </div>

        {/* 標籤頁切換 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 flex items-center gap-1 ${
                activeTab === 'image'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon size={16} />
              图片
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 flex items-center gap-1 ${
                activeTab === 'audio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Music size={16} />
              音频
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="搜索标题或链接..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg w-full"
          />
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">全部状态</option>
            <option value="true">启用</option>
            <option value="false">禁用</option>
          </select>
          <Button variant="default" onClick={() => loadAssets()}>
            刷新
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={assets}
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: (p) => setPage(p),
          }}
        />
      </Card>

      {modalVisible && (
        <MeditationAssetModal visible={modalVisible} editingItem={editingItem} onClose={() => { setModalVisible(false); loadAssets(); }} />
      )}

      {/* 圖片放大預覽彈窗 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            title="關閉 (ESC)"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage || ''}
            alt="預覽"
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.error-message')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-white text-center p-8';
                errorDiv.textContent = '圖片加載失敗';
                parent.appendChild(errorDiv);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MeditationAssetsPage;
