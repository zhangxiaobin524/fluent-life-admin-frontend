import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, InputNumber, Modal, Select, Switch, Table, message } from 'antd';

import { adminAPI } from '../../services/api';

type Plan = {
  id: string;
  name: string;
  display_name: string;
  price: number;
  currency: string;
  billing_cycle?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

const billingCycleOptions = [
  { label: '无', value: '' },
  { label: '月度', value: 'monthly' },
  { label: '年度', value: 'yearly' },
  { label: '终身', value: 'lifetime' },
];

export default function SubscriptionPlans() {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getSubscriptionPlans();
      const list: Plan[] = res?.data?.plans ?? res?.data ?? [];
      setPlans(list);
    } catch (e) {
      message.error('获取订阅方案失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const columns = useMemo(() => {
    return [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: '显示名称', dataIndex: 'display_name', key: 'display_name' },
      { title: '价格', dataIndex: 'price', key: 'price' },
      { title: '货币', dataIndex: 'currency', key: 'currency' },
      {
        title: '周期',
        dataIndex: 'billing_cycle',
        key: 'billing_cycle',
        render: (v: string) => v || '-',
      },
      {
        title: '启用',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (v: boolean) => (v ? '是' : '否'),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_: any, record: Plan) => (
          <div className="flex gap-2">
            <Button
              size="small"
              onClick={() => {
                navigate(`/subscription/plans/${record.id}/benefits`);
              }}
            >
              配置权益
            </Button>
            <Button
              size="small"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  name: record.name,
                  display_name: record.display_name,
                  price: record.price,
                  currency: record.currency,
                  billing_cycle: record.billing_cycle ?? '',
                  is_active: record.is_active,
                });
                setOpen(true);
              }}
            >
              编辑
            </Button>
            <Button
              size="small"
              danger
              onClick={async () => {
                Modal.confirm({
                  title: '确认删除？',
                  content: `将删除方案：${record.display_name}（${record.name}）`,
                  okText: '删除',
                  cancelText: '取消',
                  onOk: async () => {
                    try {
                      await adminAPI.deleteSubscriptionPlan(record.id);
                      message.success('删除成功');
                      fetchPlans();
                    } catch (e) {
                      message.error('删除失败');
                    }
                  },
                });
              }}
            >
              删除
            </Button>
          </div>
        ),
      },
    ];
  }, [form, navigate]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xl font-semibold">订阅方案</div>
          <div className="text-sm text-gray-500">管理会员类型（方案）</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPlans}>刷新</Button>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ currency: 'CNY', billing_cycle: '', is_active: true });
              setOpen(true);
            }}
          >
            新增方案
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={plans}
        columns={columns as any}
        pagination={false}
      />

      <Modal
        open={open}
        title={editing ? '编辑方案' : '新增方案'}
        okText="保存"
        cancelText="取消"
        onCancel={() => setOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const payload = {
              name: values.name,
              display_name: values.display_name,
              price: values.price,
              currency: values.currency,
              billing_cycle: values.billing_cycle ? values.billing_cycle : null,
              is_active: values.is_active,
            };

            if (editing) {
              await adminAPI.updateSubscriptionPlan(editing.id, payload);
              message.success('更新成功');
            } else {
              await adminAPI.createSubscriptionPlan(payload);
              message.success('创建成功');
            }
            setOpen(false);
            fetchPlans();
          } catch (e) {
            // validateFields 会抛错
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="例如 free / premium_monthly" />
          </Form.Item>
          <Form.Item name="display_name" label="显示名称" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="例如 免费版 / 月度会员" />
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true, message: '必填' }]}>
            <InputNumber className="w-full" min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="currency" label="货币" rules={[{ required: true, message: '必填' }]}>
            <Input placeholder="CNY" />
          </Form.Item>
          <Form.Item name="billing_cycle" label="周期">
            <Select options={billingCycleOptions} />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
