import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

const { Option } = Select;

interface SensitiveWord {
  id: string;
  word: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SensitiveWords: React.FC = () => {
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
  const [form] = Form.useForm();

  const fetchWords = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSensitiveWords({});
      if (response.code === 0 && response.data) {
        setWords(response.data.words || []);
      }
    } catch (error) {
      message.error('獲取敏感詞列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleAdd = () => {
    setEditingWord(null);
    form.resetFields();
    form.setFieldsValue({
      level: 1,
      is_active: true
    });
    setIsModalVisible(true);
  };

  const handleEdit = (word: SensitiveWord) => {
    setEditingWord(word);
    form.setFieldsValue({
      word: word.word,
      level: word.level,
      is_active: word.is_active
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingWord) {
        await adminAPI.updateSensitiveWord(editingWord.id, values);
        message.success('更新成功');
      } else {
        await adminAPI.createSensitiveWord(values);
        message.success('創建成功');
      }
      setIsModalVisible(false);
      fetchWords();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失敗');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteSensitiveWord(id);
      message.success('刪除成功');
      fetchWords();
    } catch (error) {
      message.error('刪除失敗');
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'blue';
      case 2: return 'orange';
      case 3: return 'red';
      default: return 'default';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return '警告';
      case 2: return '禁止';
      case 3: return '嚴重';
      default: return level.toString();
    }
  };

  const columns = [
    {
      title: '敏感詞',
      dataIndex: 'word',
      key: 'word',
    },
    {
      title: '敏感級別',
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => (
        <Tag color={getLevelColor(level)}>
          {getLevelLabel(level)}
        </Tag>
      )
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '啟用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '創建時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: SensitiveWord) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個敏感詞嗎？"
            onConfirm={() => handleDelete(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="dashed" danger icon={<DeleteOutlined />} size="small">
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card 
        title="敏感詞管理"
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              添加敏感詞
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchWords}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={words}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* 添加/編輯敏感詞 */}
      <Modal
        title={editingWord ? '編輯敏感詞' : '添加敏感詞'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item 
            name="word" 
            label="敏感詞" 
            rules={[{ required: true, message: '請輸入敏感詞' }]}
          >
            <Input placeholder="請輸入敏感詞" />
          </Form.Item>
          
          <Form.Item 
            name="level" 
            label="敏感級別" 
            rules={[{ required: true }]}
            tooltip="1-警告（過濾後允許發布），2-禁止（阻止發布），3-嚴重（阻止發布並記錄）"
          >
            <Select>
              <Option value={1}>1 - 警告</Option>
              <Option value={2}>2 - 禁止</Option>
              <Option value={3}>3 - 嚴重</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="is_active" 
            label="狀態"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={true}>啟用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item className="mt-6">
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SensitiveWords;
