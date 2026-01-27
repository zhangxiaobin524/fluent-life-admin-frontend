import React, { useEffect, useState, useRef } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/form/Button';
import { Plus, Edit, Trash2, Link as LinkIcon, Image as ImageIcon, Music, Play, Pause, X, ZoomIn, RefreshCw, GripVertical } from 'lucide-react';
import { Switch, message, Select, Popover } from 'antd';
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
    url?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface AudioOption {
  id: string;
  title: string;
  url: string;
}

const MeditationAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<MeditationAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [assetType, setAssetType] = useState('image'); // 初始化为 image，与 activeTab 一致
  const [activeFilter, setActiveFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'image' | 'audio'>('image');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MeditationAsset | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [audioOptions, setAudioOptions] = useState<AudioOption[]>([]);
  const [changingAudioId, setChangingAudioId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadAssets();
  }, [page, keyword, assetType, activeFilter]);

  // 當標籤切換時，更新 assetType 篩選
  useEffect(() => {
    setAssetType(activeTab);
    setPage(1); // 切換標籤時重置到第一頁
  }, [activeTab]);

  // 加载音频列表（用于图片关联选择）
  useEffect(() => {
    loadAudioOptions();
  }, []);

  const loadAudioOptions = async () => {
    try {
      const res = await adminAPI.getMeditationAssets({ asset_type: 'audio', is_active: 'true', page_size: 100 });
      if (res.code === 0 && res.data?.assets) {
        setAudioOptions(res.data.assets.map((a: any) => ({ id: a.id, title: a.title, url: a.url })));
      }
    } catch (error) {
      console.error('加载音频列表失败:', error);
    }
  };

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

  // 更换图片关联的音频
  const handleChangeLinkedAudio = async (imageRecord: MeditationAsset, newAudioId: string | null) => {
    try {
      setChangingAudioId(imageRecord.id);
      const payload = {
        asset_type: imageRecord.asset_type,
        title: imageRecord.title,
        url: imageRecord.url,
        order: imageRecord.order,
        is_active: imageRecord.is_active,
        linked_audio_id: newAudioId,
      };
      const res = await adminAPI.updateMeditationAsset(imageRecord.id, payload);
      if (res.code === 0) {
        message.success('关联音频更新成功');
        loadAssets();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error('更新关联音频失败:', error);
      message.error('更新失败，请稍后重试');
    } finally {
      setChangingAudioId(null);
    }
  };

  // 播放关联的音频
  const handlePlayLinkedAudio = (imageRecord: MeditationAsset) => {
    const linkedAudioId = imageRecord.linked_audio_id;
    const virtualAudioId = `linked-${imageRecord.id}-${linkedAudioId}`;
    
    // 检查是否正在播放，如果是则暂停
    if (playingAudioId === virtualAudioId) {
      const audio = audioRefs.current[virtualAudioId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingAudioId(null);
      return;
    }
    
    if (!linkedAudioId) {
      message.error('该图片未关联背景音乐');
      return;
    }

    // 优先使用 record.linked_audio 中的信息（后端返回的完整信息）
    let audioUrl = imageRecord.linked_audio?.url;
    let audioTitle = imageRecord.linked_audio?.title || '背景音乐';
    
    console.log('播放关联音频:', {
      linkedAudioId,
      virtualAudioId,
      linkedAudio: imageRecord.linked_audio,
      audioUrl,
      audioTitle,
      audioOptionsCount: audioOptions.length
    });
    
    // 如果 linked_audio 中没有 URL，从 audioOptions 中查找
    if (!audioUrl) {
      console.log('从 audioOptions 中查找音频信息...');
      const audioInfo = audioOptions.find(a => a.id === linkedAudioId);
      if (!audioInfo) {
        console.error('未找到音频信息:', { linkedAudioId, audioOptions });
        message.error('未找到关联的音频信息，请刷新页面重试');
        return;
      }
      audioUrl = audioInfo.url;
      audioTitle = audioInfo.title;
      console.log('从 audioOptions 找到音频:', { audioUrl, audioTitle });
    }

    if (!audioUrl || audioUrl.trim() === '') {
      console.error('音频 URL 无效:', { audioUrl, linkedAudioId });
      message.error('音频 URL 无效，无法播放');
      return;
    }

    // 构造一个虚拟的音频记录来复用播放逻辑
    const audioRecord: MeditationAsset = {
      id: virtualAudioId,
      asset_type: 'audio',
      title: audioTitle,
      url: audioUrl, // 使用原始 URL，getFullUrl 会在 handleToggleAudio 中处理
      order: 0,
      is_active: true,
      created_at: '',
      updated_at: '',
    };

    const fullUrl = getFullUrl(audioUrl);
    console.log('开始播放音频:', { 
      audioRecord, 
      fullUrl,
      originalUrl: audioUrl,
      willCallHandleToggleAudio: true
    });

    // 关键：不要在用户点击后先 await/等待任何异步（会丢失 user activation，导致浏览器拦截播放）
    void handleToggleAudio(audioRecord);

    // 可用性检测放后台，不阻塞播放
    void fetch(fullUrl, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.warn('音频文件可能不存在或无法访问:', { fullUrl, status: res.status });
        }
      })
      .catch((err) => {
        console.warn('无法验证音频文件:', err);
      });
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
    
    // 如果是相對路徑（以 / 開頭），拼接當前域名（前端服务器）
    // 静态资源存放在 public 目录下，通过前端服务器访问
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    
    // 其他情況
    return `${window.location.origin}/${url}`;
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
  const handleToggleAudio = async (record: MeditationAsset) => {
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
    
    // 驗證 URL 格式
    if (!fullUrl.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
      console.warn('音頻 URL 可能不是有效的音頻格式:', fullUrl);
    }
    
    let audio = audioRefs.current[audioId];
    if (!audio) {
      audio = new Audio();
      audioRefs.current[audioId] = audio;
      
      // 設置音頻屬性
      audio.preload = 'auto';
      audio.volume = 1.0; // 確保音量設置為最大
      audio.muted = false; // 確保不是靜音狀態
      // 移除 crossOrigin，因為同源資源不需要
      // audio.crossOrigin = 'anonymous';
      
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
          errorMessage: audioEl.error?.message,
          src: audioEl.src
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
        } else if (audioEl.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
          errorMsg = '音頻源不可用，請檢查文件是否存在';
        }
        
        message.error(`${errorMsg}: ${record.url}`);
        setPlayingAudioId(null);
      });
      
      audio.addEventListener('loadstart', () => {
        console.log('開始加載音頻:', fullUrl);
      });
      
      audio.addEventListener('loadedmetadata', () => {
        console.log('音頻元數據加載完成:', fullUrl, '時長:', audio.duration);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('音頻可以播放:', fullUrl);
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log('音頻可以流暢播放:', fullUrl);
      });
      
      // 設置音頻源
      try {
        audio.src = fullUrl;
        // 強制加載
        audio.load();
      } catch (err) {
        console.error('設置音頻源失敗:', err);
        message.error('無法設置音頻源，請檢查 URL 格式');
        setPlayingAudioId(null);
        return;
      }
    } else {
      // 如果音頻已存在但 URL 可能已改變，更新 src
      const currentSrc = audio.src.replace(window.location.origin, '');
      if (currentSrc !== record.url && !audio.src.includes(record.url)) {
        try {
          audio.src = fullUrl;
          // 重新加載音頻
          audio.load();
        } catch (err) {
          console.error('更新音頻源失敗:', err);
          message.error('無法更新音頻源');
          setPlayingAudioId(null);
          return;
        }
      }
    }
    
    // 確保音頻屬性正確設置（即使音頻已存在）
    audio.volume = 1.0;
    audio.muted = false;
    
    try {
      // 关键：点击时直接调用 play()（不要等 canplay 回调，否则会被当作“自动播放”拦截）
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      // 驗證音頻是否真的在播放
      if (audio.paused) {
        console.warn('音頻設置為播放但仍在暫停狀態，嘗試重新播放...');
        try {
          const retryPlay = await audio.play();
          if (retryPlay !== undefined) {
            await retryPlay;
          }
        } catch (retryError: any) {
          console.error('重新播放失敗:', retryError);
          // 如果是自动播放被阻止，给用户提示
          if (retryError.name === 'NotAllowedError' || retryError.name === 'NotSupportedError') {
            message.error('浏览器阻止了自动播放，请点击播放按钮重试');
          }
          throw retryError;
        }
      }
      
      console.log('音頻播放狀態:', {
        paused: audio.paused,
        volume: audio.volume,
        muted: audio.muted,
        currentTime: audio.currentTime,
        duration: audio.duration,
        readyState: audio.readyState,
        src: audio.src,
        networkState: audio.networkState
      });
      
      // 再次确认播放状态
      if (audio.paused) {
        throw new Error('音频仍在暂停状态，无法播放');
      }
      
      setPlayingAudioId(audioId);
    } catch (error: any) {
      console.error('播放音頻失敗:', {
        error,
        url: fullUrl,
        originalUrl: record.url,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });
      
      let errorMessage = '播放失敗';
      if (error.name === 'NotAllowedError') {
        errorMessage = '浏览器阻止了自动播放，请确保已与页面交互';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '音频格式不支持或文件损坏';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        errorMessage = '音頻源不可用，請檢查文件是否存在';
      } else if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
        errorMessage = '音頻尚未加載，請稍後重試';
      }
      
      console.error('播放音頻最終錯誤:', {
        error,
        errorName: error.name,
        errorMessage: error.message,
        url: fullUrl,
        originalUrl: record.url,
        networkState: audio.networkState,
        readyState: audio.readyState,
        audioSrc: audio.src
      });
      
      message.error(`${errorMessage}: ${record.title || record.url}`);
      setPlayingAudioId(null);
    }
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
    if (!playingAudioId) return;

    // 关联音频播放使用的是虚拟 ID：linked-${imageId}-${audioId}
    // 该 ID 不会出现在 assets 中，否则会被错误地当成“资源不存在”从而立刻暂停。
    if (playingAudioId.startsWith('linked-')) {
      // 注意：split('-') 不可靠，因为 UUID 里也有 '-'
      // 因为 UUID 里也有 '-'，这里用前缀 + 第一个 UUID 长度不固定会出错，所以只做“不过度停止”的兜底：
      // 如果正在播放的是 linked 虚拟音频，交由用户点击暂停/切换时手动停止。
      return;
    }

    if (!assets.find((a) => a.id === playingAudioId)) {
      const audio = audioRefs.current[playingAudioId];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingAudioId(null);
    }
  }, [assets, playingAudioId]);

  // 拖拽排序处理
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newAssets = [...assets];
    const draggedItem = newAssets[draggedIndex];
    newAssets.splice(draggedIndex, 1);
    newAssets.splice(dropIndex, 0, draggedItem);

    // 更新排序值
    const updatedAssets = newAssets.map((asset, index) => ({
      ...asset,
      order: index
    }));

    setAssets(updatedAssets);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // 批量更新排序
    try {
      const updatePromises = updatedAssets.map((asset, index) => 
        adminAPI.updateMeditationAsset(asset.id, { order: index })
      );
      await Promise.all(updatePromises);
      message.success('排序更新成功');
      loadAssets(); // 重新加载以确保数据同步
    } catch (error) {
      console.error('更新排序失败:', error);
      message.error('更新排序失败，请重试');
      loadAssets(); // 失败时重新加载恢复原状态
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const columns = [
      {
        key: 'drag',
        title: '',
        width: '40px',
        render: (_: any, _record: MeditationAsset, index: number) => (
          <div
            draggable
            onDragStart={(e) => {
              handleDragStart(index);
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="cursor-move text-gray-400 hover:text-gray-600 flex items-center justify-center"
            title="拖拽排序"
          >
            <GripVertical size={16} />
          </div>
        ),
        align: 'center' as const,
      },
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
              <>
                <div 
                  className="mt-2 relative group cursor-pointer inline-block"
                  onClick={() => handlePreviewImage(record.url)}
                >
                  <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-100 relative">
                    <img
                      src={getFullUrl(record.url)}
                      alt={value}
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.image-error-placeholder')) {
                          target.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'image-error-placeholder w-full h-full flex flex-col items-center justify-center text-xs text-gray-400 bg-gray-50';
                          errorDiv.innerHTML = `
                            <svg class="w-6 h-6 mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-[10px] px-1 text-center">加载失败</span>
                          `;
                          parent.appendChild(errorDiv);
                        }
                      }}
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded flex items-center justify-center transition-all pointer-events-none">
                    <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                {/* 关联音频展示和操作 */}
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Music size={12} />
                    <span>关联背景音乐</span>
                  </div>
                  {record.linked_audio ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]" title={record.linked_audio.title}>
                        {record.linked_audio.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayLinkedAudio(record);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                      >
                        {playingAudioId === `linked-${record.id}-${record.linked_audio_id}` ? (
                          <>
                            <Pause size={10} />
                            暂停
                          </>
                        ) : (
                          <>
                            <Play size={10} />
                            播放
                          </>
                        )}
                      </button>
                      <Popover
                        trigger="click"
                        placement="bottomLeft"
                        content={
                          <div className="w-48">
                            <Select
                              className="w-full"
                              value={record.linked_audio_id || undefined}
                              onChange={(val) => handleChangeLinkedAudio(record, val || null)}
                              loading={changingAudioId === record.id}
                              placeholder="选择音频"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              options={[
                                { label: '无（不关联）', value: '' },
                                ...audioOptions.map(a => ({ label: a.title, value: a.id }))
                              ]}
                            />
                          </div>
                        }
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                        >
                          <RefreshCw size={10} />
                          更换
                        </button>
                      </Popover>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">未关联音频</span>
                      <Popover
                        trigger="click"
                        placement="bottomLeft"
                        content={
                          <div className="w-48">
                            <Select
                              className="w-full"
                              placeholder="选择音频"
                              onChange={(val) => handleChangeLinkedAudio(record, val || null)}
                              loading={changingAudioId === record.id}
                              showSearch
                              optionFilterProp="label"
                              options={audioOptions.map(a => ({ label: a.title, value: a.id }))}
                            />
                          </div>
                        }
                      >
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        >
                          <Plus size={10} />
                          添加
                        </button>
                      </Popover>
                    </div>
                  )}
                </div>
              </>
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
          onRow={(_record: MeditationAsset, index: number) => ({
            draggable: true,
            onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
            onDragLeave: handleDragLeave,
            onDrop: (e: React.DragEvent) => handleDrop(e, index),
            onDragEnd: handleDragEnd,
            className: dragOverIndex === index ? 'bg-blue-50 border-2 border-blue-300' : draggedIndex === index ? 'opacity-50' : '',
          })}
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
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.preview-error-message')) {
                target.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'preview-error-message text-white text-center p-8';
                errorDiv.innerHTML = `
                  <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p class="text-lg mb-2">圖片加載失敗</p>
                  <p class="text-sm text-gray-400">請檢查圖片 URL 是否正確</p>
                `;
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
