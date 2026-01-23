import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { TrainingRecord, User } from '../types/index';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Activity, Users, MessageSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RandomMatchRecord {
  id: string;
  user_id: string;
  matched_user_id?: string;
  status: string;
  wait_seconds?: number;
  created_at: string;
  matched_at?: string;
  user?: User;
  matched_user?: User;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  tag?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: User;
}

const UserTrainingRecords: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'training' | 'matches' | 'posts'>('training');
  
  // 训练记录相关
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingPage, setTrainingPage] = useState(1);
  const [trainingTotal, setTrainingTotal] = useState(0);
  const [trainingTypeFilter, setTrainingTypeFilter] = useState<string>(''); // 训练类型筛选
  const [dailyDurationData, setDailyDurationData] = useState<any[]>([]);
  const [trainingTypeData, setTrainingTypeData] = useState<any[]>([]);
  
  // 匹配记录相关
  const [matchRecords, setMatchRecords] = useState<RandomMatchRecord[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchPage, setMatchPage] = useState(1);
  const [matchTotal, setMatchTotal] = useState(0);
  
  // 发帖记录相关
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  
  const [user, setUser] = useState<User | null>(null);
  const [badges, setBadges] = useState<User['achievements'] | null>(null);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    if (records.length === 0) return;

    // Process daily duration data for line chart
    const dailyMap = new Map<string, number>();
    records.forEach(record => {
      const date = format(parseISO(record.timestamp), 'yyyy-MM-dd');
      dailyMap.set(date, (dailyMap.get(date) || 0) + record.duration);
    });
    const sortedDailyData = Array.from(dailyMap.entries())
      .map(([date, duration]) => ({ date, duration }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setDailyDurationData(sortedDailyData);

    // Process training type data for pie chart
    const typeMap = new Map<string, number>();
    const typeMapCN = { meditation: '冥想', airflow: '气流', exposure: '暴露', practice: '练习' };
    records.forEach(record => {
      typeMap.set(record.type, (typeMap.get(record.type) || 0) + 1);
    });
    const typeData = Array.from(typeMap.entries())
      .map(([type, value]) => ({ name: typeMapCN[type as keyof typeof typeMapCN] || type, value }));
    setTrainingTypeData(typeData);
  }, [records]);

  const loadUser = async () => {
    if (!userId) return;
    try {
      const response = await adminAPI.getUser(userId);
      if (response.code === 0 && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('加载用户详情失败:', error);
    }
  };

  const loadUserBadges = async () => {
    if (!userId) return;
    try {
      const response = await adminAPI.getUserBadges(userId);
      if (response.code === 0 && response.data) {
        setBadges(response.data.badges || []);
      } else {
        setBadges([]);
      }
    } catch (error) {
      console.error('加载用户勋章失败:', error);
      setBadges([]);
    }
  };

  useEffect(() => {
    loadUser();
    loadUserBadges();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      if (activeTab === 'training') {
        loadUserTrainingRecords();
      } else if (activeTab === 'matches') {
        loadUserMatchRecords();
      } else if (activeTab === 'posts') {
        loadUserPosts();
      }
    }
  }, [userId, activeTab, trainingPage, matchPage, postsPage, trainingTypeFilter]);

  const loadUserTrainingRecords = async () => {
    setTrainingLoading(true);
    try {
      const params: { page: number; page_size: number; user_id: string; type?: string } = {
        page: trainingPage,
        page_size: 20,
        user_id: userId!,
      };
      if (trainingTypeFilter) {
        params.type = trainingTypeFilter;
      }
      const response = await adminAPI.getTrainingRecords(params);
      if (response.code === 0 && response.data) {
        setRecords(response.data.records || []);
        setTrainingTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载用户训练记录失败:', error);
    } finally {
      setTrainingLoading(false);
    }
  };

  const loadUserMatchRecords = async () => {
    setMatchLoading(true);
    try {
      const response = await adminAPI.getRandomMatchRecords({
        page: matchPage,
        page_size: 20,
        user_id: userId,
      });
      if (response.code === 0 && response.data) {
        setMatchRecords(response.data.records || []);
        setMatchTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载用户匹配记录失败:', error);
    } finally {
      setMatchLoading(false);
    }
  };

  const loadUserPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await adminAPI.getPosts({
        page: postsPage,
        page_size: 20,
        user_id: userId,
      });
      if (response.code === 0 && response.data) {
        setPosts(response.data.posts || []);
        setPostsTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载用户发帖记录失败:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const trainingColumns = [
    {
      key: 'type',
      title: '训练类型',
      dataIndex: 'type' as keyof TrainingRecord,
      render: (value: string) => {
        const typeMap: { [key: string]: string } = {
          meditation: '冥想',
          airflow: '气流',
          exposure: '暴露',
          practice: '练习',
        };
        return typeMap[value] || value;
      },
    },
    {
      key: 'title',
      title: '标题/场景',
      render: (_: any, record: TrainingRecord) => {
        const title = record.data?.title || record.data?.module_title || record.data?.scenarioTitle || '';
        const extra =
          record.data?.module_title && record.data?.step_title
            ? `${record.data.module_title} · ${record.data.step_title}`
            : '';
        return (
          <div className="min-w-0">
            <div className="text-sm text-gray-900 truncate max-w-[360px]">{title || '-'}</div>
            {extra && <div className="text-xs text-gray-500 truncate max-w-[360px]">{extra}</div>}
          </div>
        );
      },
    },
    {
      key: 'tool_action',
      title: '工具/动作',
      render: (_: any, record: TrainingRecord) => {
        const tool = record.data?.tool;
        const action = record.data?.action;
        return (
          <div className="text-xs text-gray-700">
            <div>{tool || '-'}</div>
            {action ? <div className="text-gray-500">动作：{action}</div> : null}
          </div>
        );
      },
    },
    {
      key: 'duration',
      title: '时长 (秒)',
      dataIndex: 'duration' as keyof TrainingRecord,
    },
    {
      key: 'timestamp',
      title: '训练时间',
      dataIndex: 'timestamp' as keyof TrainingRecord,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: 'notes',
      title: '备注/心得',
      render: (_: any, record: TrainingRecord) => (
        <span className="text-xs text-gray-700 truncate block max-w-[320px]">{record.data?.notes || '-'}</span>
      ),
    },
  ];

  const matchColumns = [
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: RandomMatchRecord) => {
        const statusMap: { [key: string]: { label: string; color: string } } = {
          pending: { label: '等待中', color: 'bg-yellow-100 text-yellow-800' },
          matched: { label: '已匹配', color: 'bg-green-100 text-green-800' },
          cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
        };
        const status = statusMap[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'matched_user',
      title: '匹配对象',
      render: (_: any, record: RandomMatchRecord) => (
        <span className="text-sm text-gray-900">
          {record.matched_user?.username || record.matched_user_id || '-'}
        </span>
      ),
    },
    {
      key: 'wait_seconds',
      title: '等待时长',
      render: (_: any, record: RandomMatchRecord) => (
        <span className="text-sm text-gray-900">
          {record.wait_seconds !== undefined ? `${record.wait_seconds} 秒` : '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: '创建时间',
      render: (_: any, record: RandomMatchRecord) => format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      key: 'matched_at',
      title: '匹配时间',
      render: (_: any, record: RandomMatchRecord) => 
        record.matched_at ? format(new Date(record.matched_at), 'yyyy-MM-dd HH:mm:ss') : '-',
    },
  ];

  const postColumns = [
    {
      key: 'content',
      title: '内容',
      render: (_: any, record: Post) => (
        <div className="text-sm text-gray-900 truncate max-w-[400px]">{record.content || '-'}</div>
      ),
    },
    {
      key: 'tag',
      title: '标签',
      render: (_: any, record: Post) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          {record.tag || '-'}
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
      render: (_: any, record: Post) => format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user ? `${user.username} 的数据统计` : '用户数据统计'}
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {user ? `用户：${user.username}（ID: ${userId}）` : `用户ID: ${userId}`}
        </p>
      </div>

      {/* 勋章展示 */}
      <div>
        {badges && badges.length > 0 ? (
          <Card shadow>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">用户勋章</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full"
                  title={`${badge.title}: ${badge.desc}`}
                >
                  <span className="text-lg">{badge.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-yellow-800">{badge.title}</span>
                    <span className="text-[10px] text-yellow-700">
                      {badge.unlocked_at ? `解锁时间：${badge.unlocked_at}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <p className="mt-1 text-xs text-gray-400">暂无勋章</p>
        )}
      </div>

      {/* 标签页 */}
      <Card shadow>
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('training')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'training'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              训练数据 ({trainingTotal})
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              1v1匹配 ({matchTotal})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              感悟广场 ({postsTotal})
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {/* 训练数据标签页 */}
          {activeTab === 'training' && (
            <div className="space-y-6">
              {/* 筛选控件 */}
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-medium text-gray-700">训练类型筛选：</label>
                <select
                  value={trainingTypeFilter}
                  onChange={(e) => {
                    setTrainingTypeFilter(e.target.value);
                    setTrainingPage(1); // 重置到第一页
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部</option>
                  <option value="meditation">冥想</option>
                  <option value="airflow">气流</option>
                  <option value="exposure">暴露</option>
                  <option value="practice">练习</option>
                </select>
                {trainingTypeFilter && (
                  <button
                    onClick={() => {
                      setTrainingTypeFilter('');
                      setTrainingPage(1);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    清除筛选
                  </button>
                )}
              </div>

              {/* 统计图表 */}
              {records.length > 0 && (
                <>
                  <Card shadow className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">每日训练时长</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dailyDurationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="duration" stroke="#8884d8" activeDot={{ r: 8 }} name="时长 (秒)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card shadow className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">训练类型分布</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={trainingTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {trainingTypeData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </>
              )}

              {/* 训练记录表格 */}
              <Table
                columns={trainingColumns}
                dataSource={records}
                loading={trainingLoading}
                striped
                pagination={{
                  current: trainingPage,
                  pageSize: 20,
                  total: trainingTotal,
                  onChange: (newPage) => setTrainingPage(newPage),
                }}
              />
            </div>
          )}

          {/* 匹配数据标签页 */}
          {activeTab === 'matches' && (
            <Table
              columns={matchColumns}
              dataSource={matchRecords}
              loading={matchLoading}
              striped
              pagination={{
                current: matchPage,
                pageSize: 20,
                total: matchTotal,
                onChange: (newPage) => setMatchPage(newPage),
              }}
            />
          )}

          {/* 发帖数据标签页 */}
          {activeTab === 'posts' && (
            <Table
              columns={postColumns}
              dataSource={posts}
              loading={postsLoading}
              striped
              pagination={{
                current: postsPage,
                pageSize: 20,
                total: postsTotal,
                onChange: (newPage) => setPostsPage(newPage),
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserTrainingRecords;
