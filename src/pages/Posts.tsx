import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Post } from '../types/index';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import { Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Column } from '../components/common/Table';

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  useEffect(() => {
    loadPosts();
  }, [page, keyword]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPosts({
        page,
        page_size: 20,
        keyword: keyword || undefined,
      });
      if (response.code === 0 && response.data) {
        setPosts(response.data.posts || []);
        setTotal(response.data.total || 0);
        setSelectedPostIds([]); // Clear selection on new data load
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allPostIds = posts.map((post) => post.id);
      setSelectedPostIds(allPostIds);
    } else {
      setSelectedPostIds([]);
    }
  };

  const handleSelectPost = (id: string) => {
    setSelectedPostIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((postId) => postId !== id)
        : [...prevSelected, id]
    );
  };

  const handleBatchDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`确定要删除这 ${ids.length} 个帖子吗？此操作不可恢复！`)) return;

    try {
      const response = await adminAPI.deletePostsBatch(ids);
      if (response.code === 0) {
        loadPosts(); // Reload posts after deletion
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
      alert('删除失败，请重试');
    }
  };

  const columns: Column<Post>[] = [
    {
      key: 'selection',
      title: (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-blue-600"
          checked={selectedPostIds.length === posts.length && posts.length > 0}
          onChange={handleSelectAll}
        />
      ),
      render: (_: any, record: Post) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-blue-600"
          checked={selectedPostIds.includes(record.id)}
          onChange={() => handleSelectPost(record.id)}
        />
      ),
      width: '50px',
    },
    {
      key: 'content',
      title: '帖子内容',
      render: (_: any, record: Post) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-2">{record.content}</p>
        </div>
      ),
    },
    {
      key: 'user',
      title: '作者',
      render: (_: any, record: Post) => (
        <span className="text-sm text-gray-900">
          {record.user?.username || '匿名用户'}
        </span>
      ),
    },
    {
      key: 'tag',
      title: '标签',
      dataIndex: 'tag' as keyof Post,
      render: (value: string) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
          {value}
        </span>
      ),
    },
    {
      key: 'likes_count',
      title: '点赞数',
      dataIndex: 'likes_count' as keyof Post,
    },
    {
      key: 'comments_count',
      title: '评论数',
      dataIndex: 'comments_count' as keyof Post,
    },
    {
      key: 'created_at',
      title: '发布时间',
      dataIndex: 'created_at' as keyof Post,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Post) => (
        <button
          onClick={() => handleBatchDelete([record.id])} // Change to use handleBatchDelete for single item
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">帖子管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统帖子内容</p>
      </div>

      <Card shadow>
        <div className="mb-4 flex items-center justify-between">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索帖子内容..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => handleBatchDelete(selectedPostIds)}
            disabled={selectedPostIds.length === 0}
            className={`ml-4 px-4 py-2 rounded text-white text-sm font-medium transition-colors ${
              selectedPostIds.length === 0
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            批量删除 ({selectedPostIds.length})
          </button>
        </div>
        <Table
          columns={columns}
          dataSource={posts}
          loading={loading}
          striped
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (newPage) => {
              setPage(newPage);
              setSelectedPostIds([]); // Clear selection on page change
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Posts;
