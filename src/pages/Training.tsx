import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Room } from '../types/index';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import { Search, Power, PowerOff, Trash2, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface RoomMember {
  id: string;
  user_id: string;
  room_id: string;
  is_host: boolean;
  joined_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

const Training: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [page, keyword, filterActive, filterType]);

  const loadRooms = async () => {
    setLoading(true);
    setSelectedRoomIds([]);
    try {
      const response = await adminAPI.getRooms({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        is_active: filterActive || undefined,
        type: filterType || undefined,
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

  const loadRoomMembers = async (roomId: string) => {
    setLoadingMembers(true);
    try {
      const response = await adminAPI.getRoom(roomId);
      if (response.code === 0 && response.data) {
        setRoomMembers(response.data.members || []);
      }
    } catch (error) {
      console.error('加载房间成员失败:', error);
      alert('加载房间成员失败');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewMembers = async (room: Room) => {
    setSelectedRoom(room);
    setShowMembersModal(true);
    await loadRoomMembers(room.id);
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

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      public_room: '公开房间',
      private_room: '私密房间',
      timed_room: '限时房间',
      practice_mode: '练习模式',
    };
    return types[type] || type;
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
      key: 'type',
      title: '房间类型',
      render: (_: any, record: Room) => (
        <span className="text-sm text-gray-900">
          {getTypeName(record.type)}
        </span>
      ),
    },
    {
      key: 'members',
      title: '成员数',
      render: (_: any, record: Room) => (
        <button
          onClick={() => handleViewMembers(record)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          title="点击查看成员列表"
        >
          <Users className="w-4 h-4" />
          <span>{record.current_members} / {record.max_members}</span>
        </button>
      ),
    },
    {
      key: 'description',
      title: '描述',
      render: (_: any, record: Room) => (
        <span className="text-sm text-gray-600 truncate max-w-xs">
          {record.description || '-'}
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
            onClick={() => handleViewMembers(record)}
            className="text-blue-600 hover:text-blue-700"
            title="查看成员"
          >
            <Eye className="w-4 h-4" />
          </button>
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
        <p className="mt-1 text-sm text-gray-500">管理系统房间信息，查看房间成员</p>
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
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value="public_room">公开房间</option>
            <option value="private_room">私密房间</option>
            <option value="timed_room">限时房间</option>
            <option value="practice_mode">练习模式</option>
          </select>
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

      {/* 成员列表模态框 */}
      {showMembersModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                房间成员 - {selectedRoom.title}
              </h2>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedRoom(null);
                  setRoomMembers([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 text-sm text-gray-600">
              当前成员数: {roomMembers.length} / {selectedRoom.max_members}
            </div>
            {loadingMembers ? (
              <div className="text-center py-8">加载中...</div>
            ) : roomMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无成员</div>
            ) : (
              <div className="space-y-2">
                {roomMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {member.user?.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          {member.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.user?.username || '未知用户'}
                          {member.is_host && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                              房主
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          加入时间: {format(new Date(member.joined_at), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
