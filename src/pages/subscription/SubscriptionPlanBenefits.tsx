import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, InputNumber, Modal, Select, Switch, Table, message } from 'antd';

import { adminAPI } from '../../services/api';
import { FEATURE_KEY_MAP, FEATURE_KEY_OPTIONS } from '../../constants/featureKeys';

type Benefit = {
  id: string;
  plan_id: string;
  feature_key: string;
  period: string;
  unit: string;
  limit_value: number;
  is_enabled: boolean;
};

const unitOptions = [
  { label: 'times（次）', value: 'times' },
  { label: 'items（上限/个）', value: 'items' },
  { label: 'minutes（分钟）', value: 'minutes' },
  { label: 'count（计数）', value: 'count' },
];

export default function SubscriptionPlanBenefits() {
  const { id: planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Benefit[]>([]);

  const fetchBenefits = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const res = await adminAPI.getSubscriptionPlanBenefits(planId);
      const list: Benefit[] = res?.data?.benefits ?? res?.data ?? [];
      setRows(list);
    } catch (e) {
      message.error('获取权益失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, [planId]);

  const addRow = () => {
    if (!planId) return;
    setRows((prev) => [
      ...prev,
      {
        id: `__new__${Date.now()}`,
        plan_id: planId,
        feature_key: '',
        period: 'daily',
        unit: 'times',
        limit_value: 0,
        is_enabled: true,
      },
    ]);
  };

  const saveAll = async () => {
    if (!planId) return;

    // basic validate
    const payload = rows
      .filter((r) => r.feature_key && r.period === 'daily')
      .map((r) => ({
        feature_key: r.feature_key.trim(),
        limit_value: Number(r.limit_value ?? 0),
        unit: r.unit,
        period: 'daily',
        is_enabled: r.is_enabled,
      }));

    if (payload.length === 0) {
      message.warning('请先添加有效的 feature_key');
      return;
    }

    const emptyKeys = rows.some((r) => !r.feature_key || r.feature_key.trim() === '');
    if (emptyKeys) {
      Modal.confirm({
        title: '存在空的 feature_key',
        content: '空的行不会保存，是否继续保存其他行？',
        okText: '继续',
        cancelText: '取消',
        onOk: async () => {
          await doSave(payload);
        },
      });
      return;
    }

    await doSave(payload);
  };

  const doSave = async (payload: Array<{ feature_key: string; limit_value: number; unit?: string; period?: string; is_enabled?: boolean }>) => {
    if (!planId) return;
    setSaving(true);
    try {
      await adminAPI.batchUpsertSubscriptionPlanBenefits(planId, payload);
      message.success('保存成功');
      fetchBenefits();
    } catch (e) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(() => {
    return [
      {
        title: '功能名称',
        key: 'feature_name',
        width: 260,
        render: (_: any, record: Benefit) => (
          <div className="text-sm">
            {FEATURE_KEY_MAP[record.feature_key] || '-'}
          </div>
        ),
      },
      {
        title: 'feature_key',
        dataIndex: 'feature_key',
        key: 'feature_key',
        render: (_: any, record: Benefit, index: number) => (
          <Select
            showSearch
            allowClear
            options={FEATURE_KEY_OPTIONS}
            value={record.feature_key || undefined}
            placeholder="选择或输入 feature_key"
            onChange={(v) => {
              setRows((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], feature_key: v || '' };
                return next;
              });
            }}
            filterOption={(input, option) => {
              const label = String(option?.label ?? '').toLowerCase();
              const value = String(option?.value ?? '').toLowerCase();
              const kw = input.toLowerCase();
              return label.includes(kw) || value.includes(kw);
            }}
          />
        ),
      },
      {
        title: 'unit',
        dataIndex: 'unit',
        key: 'unit',
        width: 180,
        render: (_: any, record: Benefit, index: number) => (
          <Select
            value={record.unit}
            options={unitOptions}
            onChange={(v) => {
              setRows((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], unit: v };
                return next;
              });
            }}
          />
        ),
      },
      {
        title: 'limit_value',
        dataIndex: 'limit_value',
        key: 'limit_value',
        width: 140,
        render: (_: any, record: Benefit, index: number) => (
          <InputNumber
            value={record.limit_value}
            className="w-full"
            onChange={(v) => {
              setRows((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], limit_value: Number(v ?? 0) };
                return next;
              });
            }}
          />
        ),
      },
      {
        title: '启用',
        dataIndex: 'is_enabled',
        key: 'is_enabled',
        width: 100,
        render: (_: any, record: Benefit, index: number) => (
          <Switch
            checked={record.is_enabled}
            onChange={(v) => {
              setRows((prev) => {
                const next = [...prev];
                next[index] = { ...next[index], is_enabled: v };
                return next;
              });
            }}
          />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 140,
        render: (_: any, record: Benefit, index: number) => (
          <div className="flex gap-2">
            <Button
              size="small"
              danger
              onClick={() => {
                // 如果是已存在记录，调删除接口；否则前端直接移除
                if (!record.id.startsWith('__new__')) {
                  Modal.confirm({
                    title: '确认删除？',
                    content: `feature_key: ${record.feature_key}`,
                    okText: '删除',
                    cancelText: '取消',
                    onOk: async () => {
                      try {
                        await adminAPI.deleteSubscriptionBenefit(record.id);
                        message.success('删除成功');
                        fetchBenefits();
                      } catch (e) {
                        message.error('删除失败');
                      }
                    },
                  });
                } else {
                  setRows((prev) => prev.filter((_, i) => i !== index));
                }
              }}
            >
              删除
            </Button>
          </div>
        ),
      },
    ];
  }, [planId]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xl font-semibold">方案权益配置（daily）</div>
          <div className="text-sm text-gray-500">plan_id: {planId}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/subscription/plans')}>返回方案列表</Button>
          <Button onClick={fetchBenefits}>刷新</Button>
          <Button onClick={addRow}>新增一行</Button>
          <Button type="primary" loading={saving} onClick={saveAll}>
            保存（批量）
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns as any}
        pagination={false}
      />

      <div className="text-xs text-gray-500 mt-3">
        说明：目前后端只支持 period=daily。limit_value：-1=无限制，0=不可用。
      </div>
    </div>
  );
}
