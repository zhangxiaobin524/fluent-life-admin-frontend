import React, { useState } from 'react';
import Card from '../../components/common/Card';
import FormItem from '../../components/form/FormItem';
import Input from '../../components/form/Input';
import Select from '../../components/form/Select';
import Button from '../../components/form/Button';
import { Save, Database, Mail, Shield } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'database' | 'email' | 'security'>('basic');

  const tabs = [
    { key: 'basic', label: '基础设置', icon: Database },
    { key: 'database', label: '数据库', icon: Database },
    { key: 'email', label: '邮件配置', icon: Mail },
    { key: 'security', label: '安全设置', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">系统设置</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统配置信息</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card shadow>
        {activeTab === 'basic' && (
          <form className="space-y-4">
            <FormItem label="系统名称">
              <Input defaultValue="流畅人生管理后台" />
            </FormItem>
            <FormItem label="系统Logo">
              <Input type="file" />
            </FormItem>
            <FormItem label="系统描述">
              <Input defaultValue="流畅人生应用管理后台系统" />
            </FormItem>
            <div className="flex justify-end">
              <Button variant="primary">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'database' && (
          <form className="space-y-4">
            <FormItem label="数据库地址">
              <Input defaultValue="localhost" />
            </FormItem>
            <FormItem label="端口">
              <Input defaultValue="5432" />
            </FormItem>
            <FormItem label="数据库名">
              <Input defaultValue="fluent_life" />
            </FormItem>
            <FormItem label="用户名">
              <Input defaultValue="postgres" />
            </FormItem>
            <div className="flex justify-end">
              <Button variant="primary">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'email' && (
          <form className="space-y-4">
            <FormItem label="SMTP服务器">
              <Input defaultValue="smtp.example.com" />
            </FormItem>
            <FormItem label="端口">
              <Input defaultValue="587" />
            </FormItem>
            <FormItem label="发件邮箱">
              <Input type="email" defaultValue="noreply@example.com" />
            </FormItem>
            <FormItem label="发件人名称">
              <Input defaultValue="流畅人生" />
            </FormItem>
            <div className="flex justify-end">
              <Button variant="primary">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form className="space-y-4">
            <FormItem label="密码最小长度">
              <Input type="number" defaultValue="6" />
            </FormItem>
            <FormItem label="登录失败次数限制">
              <Input type="number" defaultValue="5" />
            </FormItem>
            <FormItem label="会话超时时间（分钟）">
              <Input type="number" defaultValue="30" />
            </FormItem>
            <FormItem label="启用双因素认证">
              <Select
                options={[
                  { label: '是', value: 'yes' },
                  { label: '否', value: 'no' },
                ]}
                defaultValue="no"
              />
            </FormItem>
            <div className="flex justify-end">
              <Button variant="primary">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Settings;

