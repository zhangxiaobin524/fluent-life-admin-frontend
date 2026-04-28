// feature_key -> 中文名称/功能说明 字典

export const FEATURE_KEY_MAP: Record<string, string> = {
  // 正念冥想
  'meditation.background_images': '正念冥想-更多背景图片',
  'meditation.background_music': '正念冥想-更多背景音乐',
  'meditation.training_detail.ai_analysis': '正念冥想-训练详情-AI分析与建议',
  'meditation.stats.ai_analysis': '正念冥想-冥想统计-AI冥想分析',

  // 气流调节
  'airflow.practice_detail.ai_analysis': '气流调节-练习详情-AI分析',
  'airflow.data.ai_analysis': '气流调节-数据与分析-AI分析',

  // 脱敏练习
  'exposure.my_videos.ai_analysis': '脱敏练习-我的练习视频-AI分析',

  // AI导师
  'ai_tutor.chat': 'AI导师-AI对话聊天',
  'ai_tutor.simulation_roles': 'AI导师-AI实战模拟',

  // 更多工具
  'tools.play_demo': '更多工具-播放示范',
  'tools.daily_script.ai_analysis': '更多工具-今日文案朗诵-AI分析',
  'tools.tongue_twister.ai_analysis': '更多工具-绕口令朗诵-AI分析',

  // 语音练习
  'voice.1v1_call': '语音练习-1V1连麦',
  'voice.create_room': '语音练习-创建房间',

  // 个人数据
  'profile.data_analysis.personal_recommendation': '个人数据-个性化推荐',
  'settings.ai_voice_type_limit': '设置-AI语音音色',

  // 其他内部key
  'tts.premium_voice_synthesis': '高级音色合成 (内部)',
};

export const FEATURE_KEY_OPTIONS = Object.entries(FEATURE_KEY_MAP).map(([value, label]) => ({
  value,
  label: `${label} (${value})`,
}));
