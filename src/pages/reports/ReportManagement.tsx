import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Descriptions } from 'antd';
import { EyeOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface Report {
  id: string;
  reporter_id: string;
  type: 'post' | 'comment' | 'user';
  target_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'closed';
  admin_reply?: string;
  created_at: string;
  updated_at: string;
  reporter?: {
    username: string;
  };
  admin?: {
    username: string;
  };
}

const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewingReport, setReviewingReport] = useState<Report | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<{ status?: string; type?: string }>({});

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getReports(filters);
      if (response.code === 0 && response.data) {
        setReports(response.data.reports || []);
      }
    } catch (error) {
      message.error('獲取舉報列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const handleView = async (id: string) => {
    try {
      const response = await adminAPI.getReport(id);
      if (response.code === 0 && response.data) {
        setViewingReport(response.data.report || response.data);
        setIsViewModalVisible(true);
      }
    } catch (error) {
      message.error('獲取舉報詳情失敗');
    }
  };

  const handleReview = (report: Report) => {
    setReviewingReport(report);
    // 重置表单，不设置status，让用户必须选择
    form.resetFields();
    form.setFieldsValue({
      status: undefined, // 不设置默认值，强制用户选择
      admin_reply: report.admin_reply || '',
      action: ''
    });
    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values: any) => {
    if (!reviewingReport) return;
    
    try {
      console.log('🔍 提交审核数据:', { id: reviewingReport.id, values });
      const response = await adminAPI.updateReportStatus(reviewingReport.id, values);
      console.log('🔍 审核响应:', response);
      if (response.code === 0) {
        message.success('審核完成');
        setIsReviewModalVisible(false);
        // 延迟一下再刷新，确保数据库已更新
        setTimeout(() => {
          fetchReports();
        }, 300);
      } else {
        message.error(response.message || '審核失敗');
      }
    } catch (error: any) {
      console.error('🔍 审核失败:', error);
      message.error(error.response?.data?.message || '審核失敗');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'post': return '帖子';
      case 'comment': return '評論';
      case 'user': return '用戶';
      default: return type;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      spam: '垃圾信息',
      harassment: '騷擾',
      inappropriate: '不當內容',
      violence: '暴力內容',
      fake: '虛假信息',
      copyright: '版權侵權',
      other: '其他'
    };
    return reasonMap[reason] || reason;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'reviewing': return 'blue';
      case 'approved': return 'green';
      case 'rejected': return 'default';
      case 'closed': return 'gray';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待審核';
      case 'reviewing': return '審核中';
      case 'approved': return '已處理';
      case 'rejected': return '已駁回';
      case 'closed': return '已關閉';
      default: return status;
    }
  };

  const columns = [
    {
      title: '舉報人',
      dataIndex: ['reporter', 'username'],
      key: 'reporter',
      render: (username: string) => username || '未知'
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{getTypeLabel(type)}</Tag>
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => getReasonLabel(reason)
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
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
      width: 200,
      render: (_: any, record: Report) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleView(record.id)}
          >
            查看
          </Button>
          {record.status === 'pending' || record.status === 'reviewing' ? (
            <Button 
              type="default" 
              icon={<CheckCircleOutlined />} 
              size="small"
              onClick={() => handleReview(record)}
            >
              審核
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card 
        title="舉報管理"
        extra={
          <Space>
            <Select
              placeholder="篩選狀態"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="pending">待審核</Option>
              <Option value="reviewing">審核中</Option>
              <Option value="approved">已處理</Option>
              <Option value="rejected">已駁回</Option>
              <Option value="closed">已關閉</Option>
            </Select>
            <Select
              placeholder="篩選類型"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              <Option value="post">帖子</Option>
              <Option value="comment">評論</Option>
              <Option value="user">用戶</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchReports}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* 查看舉報詳情 */}
      <Modal
        title="舉報詳情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            關閉
          </Button>
        ]}
        width={700}
      >
        {viewingReport && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="舉報人">
              {viewingReport.reporter?.username || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="舉報類型">
              <Tag>{getTypeLabel(viewingReport.type)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="舉報原因">
              {getReasonLabel(viewingReport.reason)}
            </Descriptions.Item>
            <Descriptions.Item label="舉報描述">
              <div className="whitespace-pre-wrap">{viewingReport.description || '無'}</div>
            </Descriptions.Item>
            <Descriptions.Item label="狀態">
              <Tag color={getStatusColor(viewingReport.status)}>
                {getStatusLabel(viewingReport.status)}
              </Tag>
            </Descriptions.Item>
            {viewingReport.admin_reply && (
              <Descriptions.Item label="管理員回覆">
                <div className="whitespace-pre-wrap text-blue-600">{viewingReport.admin_reply}</div>
              </Descriptions.Item>
            )}
            {viewingReport.admin && (
              <Descriptions.Item label="處理管理員">
                {viewingReport.admin.username}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="創建時間">
              {new Date(viewingReport.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 審核舉報 */}
      <Modal
        title="審核舉報"
        open={isReviewModalVisible}
        onCancel={() => setIsReviewModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleReviewSubmit}
          layout="vertical"
        >
          <Form.Item name="status" label="審核狀態" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">已處理（違規）</Option>
              <Option value="rejected">已駁回（不違規）</Option>
              <Option value="closed">已關閉</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="action" 
            label="處理動作"
            tooltip="僅在狀態為'已處理'時生效"
          >
            <Select placeholder="選擇處理動作（可選）">
              <Option value="none">僅標記，不執行動作</Option>
              <Option value="delete_post">刪除帖子</Option>
              <Option value="delete_comment">刪除評論</Option>
              <Option value="ban_user">禁用用戶</Option>
              <Option value="warn_user">警告用戶</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="admin_reply" label="管理員回覆">
            <TextArea rows={4} placeholder="請輸入回覆內容..." />
          </Form.Item>
          
          <Form.Item className="mt-6">
            <Space>
              <Button type="primary" htmlType="submit">
                提交審核
              </Button>
              <Button onClick={() => setIsReviewModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportManagement;
