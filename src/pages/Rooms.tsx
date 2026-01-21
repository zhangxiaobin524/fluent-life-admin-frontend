import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Room } from '../types/index';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import { Search, Power, PowerOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    loadRooms();
  }, [page, keyword, filterActive]);

  const loadRooms = async () => {
    setLoading(true);
    setSelectedRoomIds([]); // Reset selection on load
    try {
      const response = await adminAPI.getRooms({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        is_active: filterActive || undefined,
      });
      if (response.code === 0 && response.data) {
        setRooms(response.data.rooms || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载房间失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRoomIds((prev) => [...prev, id]);
    } else {
      setSelectedRoomIds((prev) => prev.filter((roomId) => roomId !== id));
    }
  };

  const handleSelectAllRooms = (checked: boolean) => {
    if (checked) {
      setSelectedRoomIds(rooms.map((room) => room.id));
    } else {
      setSelectedRoomIds([]);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRoomIds.length === 0) {
      alert('请选择要删除的房间');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedRoomIds.length} 个房间吗？此操作不可恢复！`)) return;

    try {
      const response = await adminAPI.deleteRoomsBatch(selectedRoomIds);
      if (response.code === 0) {
        alert('批量删除成功');
        loadRooms();
      } else {
        alert(response.message || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除房间失败:', error);
      alert('批量删除失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个房间吗？此操作不可恢复！')) return;
    try {
      const response = await adminAPI.deleteRoom(id);
      if (response.code === 0) {
        loadRooms();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除房间失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await adminAPI.toggleRoom(id);
      if (response.code === 0) {
        loadRooms();
      } else {
        alert(response.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败，请重试');
    }
  };

  const columns = [
    {
      key: 'selection',
      title: (
        <input
          type="checkbox"
          checked={selectedRoomIds.length === rooms.length && rooms.length > 0}
          onChange={(e) => handleSelectAllRooms(e.target.checked)}
          className="form-checkbox"
        />
      ),
      render: (_: any, record: Room) => (
        <input
          type="checkbox"
          checked={selectedRoomIds.includes(record.id)}
          onChange={(e) => handleSelectRoom(record.id, e.target.checked)}
          className="form-checkbox"
        />
      ),
    },
    {
      key: 'title',
      title: '房间标题',
      dataIndex: 'title' as keyof Room,
    },
    {
      key: 'user',
      title: '房主',
      render: (_: any, record: Room) => (
        <span className="text-sm text-gray-900">
          {record.user?.username || '未知'}
        </span>
      ),
    },
    {
      key: 'theme',
      title: '主题',
      dataIndex: 'theme' as keyof Room,
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type' as keyof Room,
    },
    {
      key: 'members',
      title: '成员数',
      render: (_: any, record: Room) => (
        <span className="text-sm text-gray-900">
          {record.current_members} / {record.max_members}
        </span>
      ),
    },
    {
      key: 'is_active',
      title: '状态',
      dataIndex: 'is_active' as keyof Room,
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value ? '活跃' : '已关闭'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: '创建时间',
      dataIndex: 'created_at' as keyof Room,
      render: (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Room) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggle(record.id)}
            className="text-blue-600 hover:text-blue-700"
            title={record.is_active ? '关闭房间' : '开启房间'}
          >
            {record.is_active ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">房间管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统房间信息</p>
      </div>

      <Card shadow>
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索房间标题、主题..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="true">活跃</option>
            <option value="false">已关闭</option>
          </select>
          <button
            onClick={handleBatchDelete}
            disabled={selectedRoomIds.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            批量删除 ({selectedRoomIds.length})
          </button>
        </div>
        <Table
          columns={columns}
          dataSource={rooms}
          loading={loading}
          striped
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (newPage) => setPage(newPage),
          }}
        />
      </Card>
    </div>
  );
};

export default Rooms;
