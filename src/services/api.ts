import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 如果是 FormData，刪除 Content-Type header，讓瀏覽器自動設置 multipart/form-data 和 boundary
  if (config.data instanceof FormData) {
    // 刪除所有可能的 Content-Type 設置
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
    if (config.headers.common) {
      delete config.headers.common['Content-Type'];
      delete config.headers.common['content-type'];
    }
  }
  return config;
});

// 管理员API
export const adminAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/admin/login', { username, password });
    if (response.data.code === 0 && response.data.data?.token) {
      localStorage.setItem('admin_token', response.data.data.token);
    }
    return response.data;
  },

  // 用户管理
  getUsers: async (params: { page?: number; page_size?: number; keyword?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // 帖子管理
  getPosts: async (params: { page?: number; page_size?: number; keyword?: string; user_id?: string }) => {
    const response = await api.get('/admin/posts', { params });
    return response.data;
  },
  getPost: async (id: string) => {
    const response = await api.get(`/admin/posts/${id}`);
    return response.data;
  },
  deletePostsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/posts/delete-batch', { ids });
    return response.data;
  },

  // 房间管理
  getRooms: async (params: { page?: number; page_size?: number; keyword?: string; is_active?: string; type?: string }) => {
    const response = await api.get('/admin/rooms', { params });
    return response.data;
  },
  getRoom: async (id: string) => {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },
  deleteRoom: async (id: string) => {
    const response = await api.delete(`/admin/rooms/${id}`);
    return response.data;
  },
  deleteRoomsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/rooms/delete-batch', { ids });
    return response.data;
  },
  getRoomMembers: async (roomId: string) => {
    const response = await api.get(`/admin/rooms/${roomId}/members`);
    return response.data;
  },

  // 随机匹配管理
  getRandomMatchRecords: async (params: { page?: number; page_size?: number; status?: string; keyword?: string; user_id?: string }) => {
    const response = await api.get('/admin/random-match', { params });
    return response.data;
  },
  toggleRoom: async (id: string) => {
    const response = await api.patch(`/admin/rooms/${id}/toggle`);
    return response.data;
  },

  // 训练统计
  getTrainingStats: async () => {
    const response = await api.get('/admin/training/stats');
    return response.data;
  },
  // 管理员查看指定用户勋章
  getUserBadges: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/badges`);
    return response.data;
  },
  // 数据概览（后台首页）
  getDetailedStats: async () => {
    const response = await api.get('/admin/detailed-stats');
    return response.data;
  },
  getTrainingRecords: async (params: { page?: number; page_size?: number; type?: string; user_id?: string }) => {
    const response = await api.get('/admin/training/records', { params });
    return response.data;
  },
  getTrainingRecord: async (id: string) => {
    const response = await api.get(`/admin/training/records/${id}`);
    return response.data;
  },
  updateTrainingRecord: async (id: string, data: any) => {
    const response = await api.put(`/admin/training/records/${id}`, data);
    return response.data;
  },
  deleteTrainingRecordsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/training/records/delete-batch', { ids });
    return response.data;
  },

  // 绕口令管理
  getTongueTwisters: async (params: { page?: number; page_size?: number; keyword?: string; level?: string; is_active?: string }) => {
    const response = await api.get('/admin/tongue-twisters', { params });
    return response.data;
  },
  getTongueTwister: async (id: string) => {
    const response = await api.get(`/admin/tongue-twisters/${id}`);
    return response.data;
  },
  createTongueTwister: async (data: any) => {
    const response = await api.post('/admin/tongue-twisters', data);
    return response.data;
  },
  updateTongueTwister: async (id: string, data: any) => {
    const response = await api.put(`/admin/tongue-twisters/${id}`, data);
    return response.data;
  },
  deleteTongueTwistersBatch: async (ids: string[]) => {
    const response = await api.post('/admin/tongue-twisters/delete-batch', { ids });
    return response.data;
  },

  // 每日朗诵文案管理
  getDailyExpressions: async (params: { page?: number; page_size?: number; keyword?: string; is_active?: string }) => {
    const response = await api.get('/admin/daily-expressions', { params });
    return response.data;
  },
  getDailyExpression: async (id: string) => {
    const response = await api.get(`/admin/daily-expressions/${id}`);
    return response.data;
  },
  createDailyExpression: async (data: any) => {
    const response = await api.post('/admin/daily-expressions', data);
    return response.data;
  },
  updateDailyExpression: async (id: string, data: any) => {
    const response = await api.put(`/admin/daily-expressions/${id}`, data);
    return response.data;
  },
  deleteDailyExpressionsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/daily-expressions/delete-batch', { ids });
    return response.data;
  },

  // 冥想资源管理
  getMeditationAssets: async (params?: { page?: number; page_size?: number; keyword?: string; asset_type?: string; is_active?: string }) => {
    const response = await api.get('/admin/meditation-assets', { params });
    return response.data;
  },
  getMeditationAsset: async (id: string) => {
    const response = await api.get(`/admin/meditation-assets/${id}`);
    return response.data;
  },
  createMeditationAsset: async (data: any, file?: File) => {
    if (file) {
      // 使用 FormData 上传文件
      const formData = new FormData();
      formData.append('file', file);
      formData.append('asset_type', String(data.asset_type || ''));
      formData.append('title', String(data.title || ''));
      
      if (data.linked_audio_id) {
        formData.append('linked_audio_id', String(data.linked_audio_id));
      }
      
      // 確保 order 始終作為字符串發送，包括 0 和負數
      // 使用 Number.isInteger 檢查是否為有效數字
      if (data.order !== undefined && data.order !== null && Number.isInteger(data.order)) {
        formData.append('order', String(data.order));
      } else {
        // 默認值為 0
        formData.append('order', '0');
      }
      
      // 處理 is_active
      if (data.is_active !== undefined && data.is_active !== null) {
        formData.append('is_active', String(data.is_active === true || data.is_active === 'true'));
      } else {
        formData.append('is_active', 'true');
      }
      
      // 處理 duration（僅音頻需要）
      if (data.duration !== undefined && data.duration !== null && data.duration !== '') {
        const duration = Number(data.duration);
        if (!isNaN(duration) && duration >= 0) {
          formData.append('duration', String(Math.floor(duration)));
        }
      }
      
      // 請求攔截器會自動處理 FormData 的 Content-Type
      const response = await api.post('/admin/meditation-assets', formData);
      return response.data;
    } else {
      // 使用 JSON 方式
      const response = await api.post('/admin/meditation-assets', data);
      return response.data;
    }
  },
  updateMeditationAsset: async (id: string, data: any) => {
    const response = await api.put(`/admin/meditation-assets/${id}`, data);
    return response.data;
  },
  deleteMeditationAsset: async (id: string) => {
    const response = await api.delete(`/admin/meditation-assets/${id}`);
    return response.data;
  },
  deleteMeditationAssetsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/meditation-assets/delete-batch', { ids });
    return response.data;
  },

  // AI角色管理
  getAIRoles: async () => {
    const response = await api.get('/admin/ai-roles');
    return response.data;
  },
  createAIRole: async (data: any) => {
    const response = await api.post('/admin/ai-roles', data);
    return response.data;
  },
  updateAIRole: async (id: string, data: any) => {
    const response = await api.put(`/admin/ai-roles/${id}`, data);
    return response.data;
  },
  deleteAIRole: async (id: string) => {
    const response = await api.delete(`/admin/ai-roles/${id}`);
    return response.data;
  },
  initAIRolesFromConfig: async () => {
    const response = await api.post('/admin/ai-roles/init-from-config');
    return response.data;
  },

  // 音色管理
  getVoiceTypes: async () => {
    const response = await api.get('/admin/voice-types');
    return response.data;
  },
  getEnabledVoiceTypes: async () => {
    const response = await api.get('/admin/voice-types/enabled');
    return response.data;
  },
  getVoiceType: async (id: string) => {
    const response = await api.get(`/admin/voice-types/${id}`);
    return response.data;
  },
  createVoiceType: async (data: any) => {
    const response = await api.post('/admin/voice-types', data);
    return response.data;
  },
  updateVoiceType: async (id: string, data: any) => {
    const response = await api.put(`/admin/voice-types/${id}`, data);
    return response.data;
  },
  deleteVoiceType: async (id: string) => {
    const response = await api.delete(`/admin/voice-types/${id}`);
    return response.data;
  },

  // 脱敏练习场景管理
  getExposureModules: async (params: { page?: number; page_size?: number; keyword?: string }) => {
    const response = await api.get('/admin/exposure/modules', { params });
    return response.data;
  },
  getExposureModule: async (id: string) => {
    const response = await api.get(`/admin/exposure/modules/${id}`);
    return response.data;
  },
  createExposureModule: async (data: any) => {
    const response = await api.post('/admin/exposure/modules', data);
    return response.data;
  },
  updateExposureModule: async (id: string, data: any) => {
    const response = await api.put(`/admin/exposure/modules/${id}`, data);
    return response.data;
  },
  deleteExposureModule: async (id: string) => {
    const response = await api.delete(`/admin/exposure/modules/${id}`);
    return response.data;
  },
  batchUpdateModulesOrder: async (modules: Array<{ id: string; order: number }>) => {
    const response = await api.put('/admin/exposure/modules/order', { modules });
    return response.data;
  },

  // 脱敏练习步骤管理
  getExposureModuleSteps: async (moduleId: string) => {
    const response = await api.get(`/admin/exposure/modules/${moduleId}/steps`);
    return response.data;
  },
  createExposureStep: async (moduleId: string, data: any) => {
    const response = await api.post(`/admin/exposure/modules/${moduleId}/steps`, data);
    return response.data;
  },
  updateExposureStep: async (stepId: string, data: any) => {
    const response = await api.put(`/admin/exposure/steps/${stepId}`, data);
    return response.data;
  },
  deleteExposureStep: async (stepId: string) => {
    const response = await api.delete(`/admin/exposure/steps/${stepId}`);
    return response.data;
  },
  batchUpdateStepsOrder: async (moduleId: string, steps: Array<{ id: string; order: number }>) => {
    const response = await api.put(`/admin/exposure/modules/${moduleId}/steps/order`, { steps });
    return response.data;
  },

  // 视频管理
  getVideos: async (params?: { page?: number; page_size?: number; source?: string; user_id?: string; module_id?: string }) => {
    const response = await api.get('/admin/videos', { params });
    return response.data;
  },
  getVideoDetail: async (id: string, source?: string) => {
    const response = await api.get(`/admin/videos/${id}`, { params: { source } });
    return response.data;
  },
  deleteVideo: async (id: string, source?: string) => {
    const response = await api.delete(`/admin/videos/${id}`, { params: { source } });
    return response.data;
  },
  batchDeleteVideos: async (videoIds: Array<{ id: string; source: string }>) => {
    const response = await api.post('/admin/videos/batch-delete', { video_ids: videoIds });
    return response.data;
  },

  // 权限管理 - 角色管理
  getRoles: async (params?: { page?: number; page_size?: number }) => {
    const response = await api.get('/admin/roles', { params });
    return response.data;
  },
  getRole: async (id: string) => {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data;
  },
  createRole: async (data: { name: string; code: string; description?: string; permissions?: string[] }) => {
    const response = await api.post('/admin/roles', data);
    return response.data;
  },
  updateRole: async (id: string, data: { name?: string; code?: string; description?: string; permissions?: string[] }) => {
    const response = await api.put(`/admin/roles/${id}`, data);
    return response.data;
  },
  deleteRole: async (id: string) => {
    const response = await api.delete(`/admin/roles/${id}`);
    return response.data;
  },

  // 权限管理 - 菜单管理
  getMenus: async (params?: { page?: number; page_size?: number }) => {
    const response = await api.get('/admin/menus', { params });
    return response.data;
  },
  getMenu: async (id: string) => {
    const response = await api.get(`/admin/menus/${id}`);
    return response.data;
  },
  createMenu: async (data: { name: string; path?: string; icon?: string; parent_id?: string; sort?: number }) => {
    const response = await api.post('/admin/menus', data);
    return response.data;
  },
  updateMenu: async (id: string, data: { name?: string; path?: string; icon?: string; parent_id?: string; sort?: number }) => {
    const response = await api.put(`/admin/menus/${id}`, data);
    return response.data;
  },
  deleteMenu: async (id: string) => {
    const response = await api.delete(`/admin/menus/${id}`);
    return response.data;
  },

  // 法律文档管理
  getLegalDocuments: async (params?: { page?: number; page_size?: number; type?: string; is_active?: string }) => {
    const response = await api.get('/admin/legal-documents', { params });
    return response.data;
  },
  getLegalDocument: async (id: string) => {
    const response = await api.get(`/admin/legal-documents/${id}`);
    return response.data;
  },
  createLegalDocument: async (data: any) => {
    const response = await api.post('/admin/legal-documents', data);
    return response.data;
  },
  updateLegalDocument: async (id: string, data: any) => {
    const response = await api.put(`/admin/legal-documents/${id}`, data);
    return response.data;
  },
  deleteLegalDocument: async (id: string) => {
    const response = await api.delete(`/admin/legal-documents/${id}`);
    return response.data;
  },

  // App 设置管理
  getAppSettings: async () => {
    const response = await api.get('/admin/app-settings');
    return response.data;
  },
  createAppSetting: async (data: any) => {
    const response = await api.post('/admin/app-settings', data);
    return response.data;
  },
  updateAppSetting: async (id: string, data: any) => {
    const response = await api.put(`/admin/app-settings/${id}`, data);
    return response.data;
  },
  deleteAppSetting: async (id: string) => {
    const response = await api.delete(`/admin/app-settings/${id}`);
    return response.data;
  },

  // 评论管理
  getComments: async (params: { page?: number; page_size?: number; keyword?: string; post_id?: string; user_id?: string }) => {
    const response = await api.get('/admin/comments', { params });
    return response.data;
  },
  getComment: async (id: string) => {
    const response = await api.get(`/admin/comments/${id}`);
    return response.data;
  },
  updateComment: async (id: string, data: any) => {
    const response = await api.put(`/admin/comments/${id}`, data);
    return response.data;
  },
  deleteCommentsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/comments/delete-batch', { ids });
    return response.data;
  },

  // 版本管理
  getVersions: async (params?: { page?: number; page_size?: number; platform?: string; is_active?: boolean }) => {
    const response = await api.get('/admin/versions', { params });
    return response.data;
  },
  getVersion: async (id: string) => {
    const response = await api.get(`/admin/versions/${id}`);
    return response.data;
  },
  createVersion: async (data: any) => {
    const response = await api.post('/admin/versions', data);
    return response.data;
  },
  updateVersion: async (id: string, data: any) => {
    const response = await api.put(`/admin/versions/${id}`, data);
    return response.data;
  },
  deleteVersion: async (id: string) => {
    const response = await api.delete(`/admin/versions/${id}`);
    return response.data;
  },
  // 更新日志管理
  getUpdateLogs: async (params?: { page?: number; page_size?: number; version_id?: string }) => {
    const response = await api.get('/admin/update-logs', { params });
    return response.data;
  },
  createUpdateLog: async (data: any) => {
    const response = await api.post('/admin/update-logs', data);
    return response.data;
  },
  updateUpdateLog: async (id: string, data: any) => {
    const response = await api.put(`/admin/update-logs/${id}`, data);
    return response.data;
  },
  deleteUpdateLog: async (id: string) => {
    const response = await api.delete(`/admin/update-logs/${id}`);
    return response.data;
  },

  // 公告管理
  getAnnouncements: async (params?: { page?: number; page_size?: number; type?: string; is_active?: string }) => {
    const response = await api.get('/admin/announcements', { params });
    return response.data;
  },
  getAnnouncement: async (id: string) => {
    const response = await api.get(`/admin/announcements/${id}`);
    return response.data;
  },
  createAnnouncement: async (data: any) => {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },
  updateAnnouncement: async (id: string, data: any) => {
    const response = await api.put(`/admin/announcements/${id}`, data);
    return response.data;
  },
  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data;
  },

  // 功能引导管理
  getFeatureGuides: async (params?: { page?: number; page_size?: number; platform?: string; is_active?: string }) => {
    const response = await api.get('/admin/feature-guides', { params });
    return response.data;
  },
  getFeatureGuide: async (id: string) => {
    const response = await api.get(`/admin/feature-guides/${id}`);
    return response.data;
  },
  createFeatureGuide: async (data: any) => {
    const response = await api.post('/admin/feature-guides', data);
    return response.data;
  },
  updateFeatureGuide: async (id: string, data: any) => {
    const response = await api.put(`/admin/feature-guides/${id}`, data);
    return response.data;
  },
  deleteFeatureGuide: async (id: string) => {
    const response = await api.delete(`/admin/feature-guides/${id}`);
    return response.data;
  },

  // 通知管理
  getNotifications: async (params: { 
    page?: number; 
    page_size?: number; 
    keyword?: string; 
    type?: string;
    user_id?: string;
    is_read?: string;
  }) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },
  getNotification: async (id: string) => {
    const response = await api.get(`/admin/notifications/${id}`);
    return response.data;
  },
  getNotificationStats: async () => {
    const response = await api.get('/admin/notifications/stats');
    return response.data;
  },
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/admin/notifications/${id}`);
    return response.data;
  },
  deleteNotificationsBatch: async (ids: string[]) => {
    const response = await api.post('/admin/notifications/delete-batch', { ids });
    return response.data;
  },
};

export default api;

