import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

const { Option } = Select;
const { Search } = Input;

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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchWords = async (page = 1, pageSize = 20, keyword = '') => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };
      if (keyword && keyword.trim()) {
        params.keyword = keyword.trim();
      }
      console.log('🔍 搜索敏感词，参数:', params);
      const response = await adminAPI.getSensitiveWords(params);
      console.log('🔍 搜索结果:', response);
      if (response.code === 0 && response.data) {
        setWords(response.data.words || []);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.total || 0,
        });
      } else {
        message.error(response.message || '獲取敏感詞列表失敗');
      }
    } catch (error: any) {
      console.error('🔍 搜索失败:', error);
      message.error(error?.response?.data?.message || '獲取敏感詞列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords(1, pagination.pageSize, '');
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
      fetchWords(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失敗');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAPI.deleteSensitiveWord(id);
      message.success('刪除成功');
      fetchWords(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error) {
      message.error('刪除失敗');
    }
  };

  const handleTableChange = (page: number, pageSize: number) => {
    fetchWords(page, pageSize, searchKeyword);
  };

  const handleSearch = (value: string) => {
    const keyword = value.trim();
    console.log('🔍 handleSearch 被调用，关键词:', keyword);
    setSearchKeyword(keyword);
    // 重置分页到第一页并执行搜索
    const currentPageSize = pagination.pageSize;
    setPagination(prev => ({ ...prev, current: 1 }));
    // 直接调用fetchWords进行搜索
    fetchWords(1, currentPageSize, keyword);
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
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              添加敏感詞
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchWords(pagination.current, pagination.pageSize, searchKeyword)}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索敏感詞..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchKeyword}
            onSearch={handleSearch}
            onChange={(e) => {
              const value = e.target.value;
              // 更新输入框的值，但不立即搜索（等待用户点击搜索或按回车）
              setSearchKeyword(value);
              // 如果清空了，立即搜索
              if (value === '') {
                handleSearch('');
              }
            }}
            style={{ maxWidth: 400 }}
          />
        </div>
        <Table
          dataSource={words}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
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
