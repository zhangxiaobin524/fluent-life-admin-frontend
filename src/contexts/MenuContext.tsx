import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAPI } from '../services/api';
import { Menu } from '../types/index';

interface MenuContextType {
  menus: Menu[];
  loading: boolean;
  refreshMenus: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);

  const sortMenus = (menuArray: Menu[]) => {
    menuArray.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    menuArray.forEach((menu) => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
  };

  const loadMenus = async () => {
    setLoading(true);
    try {
      // 获取所有菜单（不分页）
      const response = await adminAPI.getMenus({ page: 1, page_size: 1000 });
      if (response.code === 0 && response.data) {
        // 后端已返回树结构（顶级菜单 + children），前端不再重建树，避免覆盖 children
        const menuTree: Menu[] = response.data.menus || [];
        sortMenus(menuTree);
        setMenus(menuTree);
      }
    } catch (error) {
      console.error('加载菜单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  // 监听菜单更新事件
  useEffect(() => {
    const handleMenuUpdate = () => {
      loadMenus();
    };

    window.addEventListener('menuUpdated', handleMenuUpdate);
    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
    };
  }, []);

  return (
    <MenuContext.Provider value={{ menus, loading, refreshMenus: loadMenus }}>
      {children}
    </MenuContext.Provider>
  );
};
