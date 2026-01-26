import { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, Eye, FileSearch } from 'lucide-react';
import { adminAPI } from '../services/api';

interface LogFile {
  name: string;
  size: number;
  modified: string;
  modified_unix: number;
}

interface LogContent {
  filename: string;
  lines: string[];
  count: number;
}

interface LogStats {
  total: {
    files: number;
    size: number;
  };
  access: {
    files: number;
    size: number;
  };
  error: {
    files: number;
    size: number;
  };
  sql: {
    files: number;
    size: number;
  };
}

const SystemLogs = () => {
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logContent, setLogContent] = useState<LogContent | null>(null);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [lines, setLines] = useState(100);
  const [tailOnly, setTailOnly] = useState(true);

  // 加载日志文件列表
  const loadLogFiles = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getLogs();
      if (response.code === 0 && response.data) {
        setLogFiles(response.data.logs || []);
      }
    } catch (error) {
      console.error('加载日志文件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载日志统计
  const loadStats = async () => {
    try {
      const response = await adminAPI.getLogStats();
      if (response.code === 0 && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载日志统计失败:', error);
    }
  };

  // 加载日志内容
  const loadLogContent = async (filename: string) => {
    setLoading(true);
    setSelectedFile(filename);
    try {
      const response = await adminAPI.getLogContent(filename, { lines, tail: tailOnly });
      if (response.code === 0 && response.data) {
        setLogContent(response.data);
      }
    } catch (error) {
      console.error('加载日志内容失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索日志
  const searchLogs = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await adminAPI.searchLogs({
        keyword: searchKeyword,
        type: searchType,
        limit: 100,
      });
      if (response.code === 0 && response.data) {
        setSearchResults(response.data.results || []);
      }
    } catch (error) {
      console.error('搜索日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    loadLogFiles();
    loadStats();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          系统日志管理
        </h1>
        <p className="text-gray-500 mt-1">查看和管理系统日志文件</p>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">总日志文件</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total.files}</div>
            <div className="text-xs text-gray-400 mt-1">{formatFileSize(stats.total.size)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">访问日志</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.access.files}</div>
            <div className="text-xs text-gray-400 mt-1">{formatFileSize(stats.access.size)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">错误日志</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.error.files}</div>
            <div className="text-xs text-gray-400 mt-1">{formatFileSize(stats.error.size)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">SQL 日志</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.sql.files}</div>
            <div className="text-xs text-gray-400 mt-1">{formatFileSize(stats.sql.size)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：日志文件列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">日志文件</h2>
              <button
                onClick={loadLogFiles}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="刷新"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading && logFiles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">加载中...</div>
              ) : logFiles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无日志文件</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logFiles.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => loadLogContent(file.name)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedFile === file.name ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)} · {formatDate(file.modified)}
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：日志内容和搜索 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 搜索功能 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileSearch className="w-5 h-5" />
              日志搜索
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入搜索关键词..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && searchLogs()}
              />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部</option>
                <option value="access">访问日志</option>
                <option value="error">错误日志</option>
                <option value="sql">SQL 日志</option>
              </select>
              <button
                onClick={searchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 border-b border-gray-200 last:border-b-0">
                    <div className="text-xs text-gray-500 mb-1">
                      {result.filename} (第 {result.line} 行)
                    </div>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                      {result.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 日志内容 */}
          {logContent && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{logContent.filename}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    共 {logContent.count} 行
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lines}
                    onChange={(e) => setLines(Number(e.target.value))}
                    min={1}
                    max={10000}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <label className="text-sm text-gray-600 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={tailOnly}
                      onChange={(e) => setTailOnly(e.target.checked)}
                      className="rounded"
                    />
                    仅显示最后 N 行
                  </label>
                  <button
                    onClick={() => selectedFile && loadLogContent(selectedFile)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    刷新
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm max-h-[500px] overflow-y-auto">
                  {logContent.lines.length === 0 ? (
                    <div className="text-gray-500">日志内容为空</div>
                  ) : (
                    logContent.lines.map((line, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-400 mr-2">{index + 1}</span>
                        <span className={line.includes('ERROR') || line.includes('错误') ? 'text-red-400' : 
                                         line.includes('WARN') || line.includes('警告') ? 'text-yellow-400' : 
                                         'text-gray-100'}>
                          {line}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {!logContent && !searchResults.length && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">请从左侧选择一个日志文件查看内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
