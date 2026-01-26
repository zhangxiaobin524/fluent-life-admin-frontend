import React from 'react';
import { X, User, Bot, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface AIConversation {
  id: string;
  user_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface Props {
  conversation: AIConversation;
  onClose: () => void;
}

const AIConversationDetailModal: React.FC<Props> = ({ conversation, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-3">
            {conversation.user?.avatar_url ? (
              <img
                src={conversation.user.avatar_url}
                alt={conversation.user.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {conversation.user?.username || '未知用户'} 的对话
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>创建: {format(new Date(conversation.created_at), 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>更新: {format(new Date(conversation.updated_at), 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
                <span>共 {conversation.messages?.length || 0} 条消息</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.messages && conversation.messages.length > 0 ? (
            conversation.messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp
                      ? format(new Date(message.timestamp), 'HH:mm:ss')
                      : format(new Date(conversation.created_at), 'HH:mm:ss')}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">暂无消息</div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="border-t p-4 bg-gray-50">
          <div className="text-sm text-gray-600">
            <div>对话ID: {conversation.id}</div>
            <div>用户ID: {conversation.user_id}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConversationDetailModal;
