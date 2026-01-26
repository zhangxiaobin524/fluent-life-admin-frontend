import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { FileText, Image, Music, Video, Search, ExternalLink, Download, HardDrive } from 'lucide-react';
import { format } from 'date-fns';

interface FileInfo {
  url: string;
  type: 'image' | 'audio' | 'video' | 'other';
  size: number;
  uploaded_at: string;
  source: string;
  source_id: string;
  source_title: string;
}

interface FileStats {
  total_files: number;
  total_size: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
  image_count: number;
  audio_count: number;
  video_count: number;
  other_count: number;
}

const Files: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadFiles();
    loadStats();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getFiles();
      if (response.code === 0) {
        setFiles(response.data.files || []);
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminAPI.getFileStats();
      if (response.code === 0) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载文件统计失败:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5 text-blue-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-green-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      image: '图片',
      audio: '音频',
      video: '视频',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const getSourceName = (source: string) => {
    const sourceMap: Record<string, string> = {
      post: '帖子',
      meditation_asset: '冥想资源',
      user_avatar: '用户头像',
      video: '视频',
    };
    return sourceMap[source] || source;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '未知';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((file) => {
    if (filterType && file.type !== filterType) return false;
    if (filterSource && file.source !== filterSource) return false;
    if (keyword && !file.url.toLowerCase().includes(keyword.toLowerCase()) && 
        !file.source_title.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const columns = [
    {
      key: 'type',
      title: '类型',
      render: (_: any, file: FileInfo) => (
        <div className="flex items-center gap-2">
          {getFileIcon(file.type)}
          <span className="text-sm text-gray-700">{getTypeName(file.type)}</span>
        </div>
      ),
    },
    {
      key: 'url',
      title: '文件URL',
      render: (_: any, file: FileInfo) => (
        <div className="max-w-md">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 truncate block flex items-center gap-1"
            title={file.url}
          >
            {file.url.substring(0, 60)}{file.url.length > 60 ? '...' : ''}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ),
    },
    {
      key: 'source',
      title: '来源',
      render: (_: any, file: FileInfo) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{getSourceName(file.source)}</div>
          <div className="text-xs text-gray-500 truncate max-w-xs" title={file.source_title}>
            {file.source_title}
          </div>
        </div>
      ),
    },
    {
      key: 'size',
      title: '大小',
      render: (_: any, file: FileInfo) => (
        <span className="text-sm text-gray-700">{formatFileSize(file.size)}</span>
      ),
    },
    {
      key: 'uploaded_at',
      title: '上传时间',
      render: (_: any, file: FileInfo) => (
        <span className="text-sm text-gray-700">
          {format(new Date(file.uploaded_at), 'yyyy-MM-dd HH:mm')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, file: FileInfo) => (
        <div className="flex gap-2">
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="查看"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={file.url}
            download
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="下载"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">文件管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统上传的文件</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card shadow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总文件数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_files}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card shadow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">图片</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.image_count}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card shadow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">音频</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.audio_count}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card shadow>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">视频</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.video_count}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 文件列表 */}
      <Card>
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文件URL或来源..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value="image">图片</option>
            <option value="audio">音频</option>
            <option value="video">视频</option>
            <option value="other">其他</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部来源</option>
            <option value="post">帖子</option>
            <option value="meditation_asset">冥想资源</option>
            <option value="user_avatar">用户头像</option>
            <option value="video">视频</option>
          </select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredFiles}
          loading={loading}
          striped
        />
      </Card>
    </div>
  );
};

export default Files;
