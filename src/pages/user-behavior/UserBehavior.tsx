import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/common/Card';
import { Users, TrendingUp, Activity, Clock, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const UserBehavior: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activityTrend, setActivityTrend] = useState<any[]>([]);
  const [functionUsage, setFunctionUsage] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, trendRes, usageRes] = await Promise.all([
        adminAPI.getUserBehaviorStats(),
        adminAPI.getUserActivityTrend({ days: 30 }),
        adminAPI.getUserFunctionUsage(),
      ]);

      if (statsRes.code === 0) {
        setStats(statsRes.data);
      }
      if (trendRes.code === 0) {
        setActivityTrend(trendRes.data.trend || []);
      }
      if (usageRes.code === 0) {
        setFunctionUsage(usageRes.data.functions || []);
      }
    } catch (error) {
      console.error('加载用户行为数据失败:', error);
    }
  };

  const statCards = [
    {
      title: '日活用户',
      value: stats?.daily_active_users || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '周活用户',
      value: stats?.weekly_active_users || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '月活用户',
      value: stats?.monthly_active_users || 0,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '次日留存率',
      value: stats?.day1_retention ? `${stats.day1_retention.toFixed(1)}%` : '0%',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: '7日留存率',
      value: stats?.day7_retention ? `${stats.day7_retention.toFixed(1)}%` : '0%',
      icon: BarChart3,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: '30日留存率',
      value: stats?.day30_retention ? `${stats.day30_retention.toFixed(1)}%` : '0%',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: '7天未活跃',
      value: stats?.inactive_users_7_days || 0,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '30天未活跃',
      value: stats?.inactive_users_30_days || 0,
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  const trendData = activityTrend.map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    活跃用户: item.active_users || 0,
    新增用户: item.new_users || 0,
    登录次数: item.logins || 0,
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const functionUsageData = functionUsage.map((func: any) => ({
    name: func.function_name,
    value: func.usage_rate || 0,
    userCount: func.user_count || 0,
    usageCount: func.usage_count || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">用户行为分析</h1>
        <p className="mt-1 text-sm text-gray-500">分析用户活跃度、留存率和功能使用情况</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} shadow>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="用户活跃度趋势（最近30天）" shadow>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="活跃用户" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="新增用户" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="登录次数" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="功能使用率" shadow>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={functionUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {functionUsageData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="功能使用统计" shadow>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={functionUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              <Bar dataKey="userCount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="使用用户数" />
              <Bar dataKey="usageCount" fill="#10b981" radius={[4, 4, 0, 0]} name="使用次数" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="功能使用详情" shadow>
          <div className="space-y-3">
            {functionUsage.map((func: any, index: number) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{func.function_name}</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {func.usage_rate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>使用用户: {func.user_count || 0}</span>
                  <span>使用次数: {func.usage_count || 0}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${func.usage_rate || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserBehavior;
