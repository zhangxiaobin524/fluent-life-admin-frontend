import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Clock, CheckCircle, XCircle, Search } from 'lucide-react';

interface MatchRecord {
  id: string;
  user_id: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  status: string; // pending, matched, cancelled, timeout
  created_at: string;
  matched_at?: string;
  matched_user_id?: string;
  matched_user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  wait_time?: number; // 等待时间（秒）
}

const RandomMatch: React.FC = () => {
  const [records, setRecords] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadRecords();
  }, [page, statusFilter, searchKeyword]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRandomMatchRecords({
        page,
        page_size: pageSize,
        status: statusFilter,
        keyword: searchKeyword,
      });
      if (response.code === 0 && response.data) {
        setRecords(response.data.records || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载随机匹配记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      pending: { label: '匹配中', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      matched: { label: '匹配成功', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-3 h-3" /> },
      timeout: { label: '超时', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6" />
          随机匹配记录
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          查看用户发起的随机匹配记录和匹配结果
        </p>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索用户名..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="pending">匹配中</option>
            <option value="matched">匹配成功</option>
            <option value="cancelled">已取消</option>
            <option value="timeout">超时</option>
          </select>
          <button
            onClick={loadRecords}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">总匹配次数</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">匹配成功</p>
              <p className="text-2xl font-bold text-green-600">
                {records.filter(r => r.status === 'matched').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">匹配中</p>
              <p className="text-2xl font-bold text-yellow-600">
                {records.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">失败/取消</p>
              <p className="text-2xl font-bold text-red-600">
                {records.filter(r => r.status === 'cancelled' || r.status === 'timeout').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* 记录表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发起用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  匹配用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  等待时长
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发起时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  匹配时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无记录
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={record.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.user?.username}`}
                          alt={record.user?.username}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.user?.username || '未知用户'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {record.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.matched_user ? (
                        <div className="flex items-center">
                          <img
                            src={record.matched_user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.matched_user.username}`}
                            alt={record.matched_user.username}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.matched_user.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {record.matched_user_id?.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDuration(record.wait_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.matched_at ? new Date(record.matched_at).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {total > pageSize && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{(page - 1) * pageSize + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(page * pageSize, total)}</span> 条，共{' '}
                  <span className="font-medium">{total}</span> 条
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  {[...Array(Math.ceil(total / pageSize))].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === Math.ceil(total / pageSize) ||
                      (pageNum >= page - 2 && pageNum <= page + 2)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 3 || pageNum === page + 3) {
                      return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RandomMatch;
