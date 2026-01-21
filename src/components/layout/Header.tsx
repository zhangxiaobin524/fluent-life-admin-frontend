import React from 'react';
import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-64 right-0 z-30">
      <div className="h-full flex items-center justify-between px-6">
        {/* 搜索框 */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 右侧操作 */}
        <div className="flex items-center gap-4">
          {/* 通知中心：跳转到用户设置里的通知设置页面 */}
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
            onClick={() => navigate('/user-settings')}
            title="通知中心"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* 系统设置：跳转到系统设置页面 */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
            onClick={() => navigate('/settings')}
            title="系统设置"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            <span className="text-sm text-gray-700">管理员</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

