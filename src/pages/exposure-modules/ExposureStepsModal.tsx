import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../../components/form/Button';
import Input from '../../components/form/Input';
import Textarea from '../../components/form/Textarea';
import FormItem from '../../components/form/FormItem';
import Select from '../../components/form/Select';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';

interface PopupConfig {
  keywords: string; // 需要高亮的关键词，用逗号分隔
  title: string; // 弹窗标题
  content: string; // 弹窗内容
}

interface Step {
  id: string;
  module_id: string;
  step_order: number;
  step_type: string;
  title: string;
  description: string;
  guide_content?: string;
  scenario_list_title?: string;
  scenario_list_content?: string;
  popup_configs?: string; // JSON字符串，包含多个弹窗配置
  icon: string;
  courage_text?: string; // 语音鼓励认知文本
}

interface ExposureStepsModalProps {
  visible: boolean;
  module: any;
  onClose: () => void;
}

const ExposureStepsModal: React.FC<ExposureStepsModalProps> = ({
  visible,
  module,
  onClose,
}) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    step_order: 1,
    step_type: 'approach',
    title: '',
    description: '',
    guide_content: '',
    scenario_list_title: '',
    scenario_list_content: '',
    popup_configs: '[]', // JSON字符串，包含多个弹窗配置
    icon: '',
    courage_text: '',
  });
  
  const [popupConfigs, setPopupConfigs] = useState<PopupConfig[]>([]);

  useEffect(() => {
    if (visible && module) {
      loadSteps();
    }
  }, [visible, module]);

  const loadSteps = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getExposureModuleSteps(module.id);
      if (response.code === 0 && response.data) {
        // 按 step_order 排序
        const sortedSteps = (response.data.steps || []).sort((a: Step, b: Step) => 
          a.step_order - b.step_order
        );
        setSteps(sortedSteps);
      }
    } catch (error) {
      console.error('加载步骤失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setFormData({
      step_order: steps.length + 1,
      step_type: 'approach',
      title: '',
      description: '',
      guide_content: '',
      scenario_list_title: '',
      scenario_list_content: '',
      popup_configs: '[]',
      icon: '',
      courage_text: '',
    });
    setPopupConfigs([]);
    setShowStepForm(true);
  };

  const handleEditStep = (step: Step) => {
    setEditingStep(step);
      // 解析popup_configs
      let configs: PopupConfig[] = [];
      if (step.popup_configs) {
        try {
          configs = JSON.parse(step.popup_configs);
        } catch (e) {
          console.error('解析弹窗配置失败:', e);
          configs = [];
        }
      }
      
      setFormData({
        step_order: step.step_order,
        step_type: step.step_type,
        title: step.title,
        description: step.description,
        guide_content: step.guide_content || '',
        scenario_list_title: step.scenario_list_title || '',
        scenario_list_content: step.scenario_list_content || '',
        popup_configs: step.popup_configs || '[]',
        icon: step.icon,
        courage_text: step.courage_text || '',
      });
      setPopupConfigs(configs);
    setShowStepForm(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('确定要删除这个步骤吗？')) return;
    
    try {
      const response = await adminAPI.deleteExposureStep(stepId);
      if (response.code === 0) {
        loadSteps();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除步骤失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', stepId);
    // 添加拖拽时的视觉反馈
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedStepId(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedStepId && draggedStepId !== targetStepId) {
      setDragOverStepId(targetStepId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStepId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStepId: string) => {
    e.preventDefault();
    
    if (!draggedStepId || draggedStepId === targetStepId) {
      return;
    }

    // 重新排序步骤
    const draggedIndex = steps.findIndex(s => s.id === draggedStepId);
    const targetIndex = steps.findIndex(s => s.id === targetStepId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // 创建新的步骤数组
    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    // 更新本地状态（立即更新UI）
    setSteps(newSteps);

    // 更新步骤顺序，同时更新本地状态的 step_order
    const updatedSteps = newSteps.map((step, index) => {
      step.step_order = index + 1;
      return {
        id: step.id,
        order: index + 1,
      };
    });

    try {
      const response = await adminAPI.batchUpdateStepsOrder(module.id, updatedSteps);
      if (response.code === 0) {
        // 更新本地状态的 step_order
        setSteps(newSteps.map((step, index) => ({
          ...step,
          step_order: index + 1,
        })));
      } else {
        // 如果更新失败，恢复原顺序
        loadSteps();
        alert(response.message || '更新顺序失败');
      }
    } catch (error) {
      console.error('更新步骤顺序失败:', error);
      // 如果更新失败，恢复原顺序
      loadSteps();
      alert('更新顺序失败，请重试');
    }

    setDraggedStepId(null);
    setDragOverStepId(null);
  };

  const handleSubmitStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.icon) {
      alert('请填写所有必填字段');
      return;
    }

    setLoading(true);
    try {
      if (editingStep) {
        // 确保所有字段都发送，包括空字符串
        // 明确包含所有字段，即使值为空字符串也要发送
        // 将弹窗配置数组转换为JSON字符串
        const popupConfigsJson = JSON.stringify(popupConfigs);
        
        const updateData: any = {
          step_order: formData.step_order,
          step_type: formData.step_type,
          title: formData.title,
          description: formData.description,
          guide_content: formData.guide_content || '',
          scenario_list_title: formData.scenario_list_title || '',
          scenario_list_content: formData.scenario_list_content || '',
          popup_configs: popupConfigsJson,
          icon: formData.icon,
          courage_text: formData.courage_text || '',
        };
        console.log('发送更新数据:', updateData);
        console.log('tip_title值:', updateData.tip_title);
        console.log('tip_content值:', updateData.tip_content);
        const response = await adminAPI.updateExposureStep(editingStep.id, updateData);
        if (response.code === 0) {
          alert('更新成功');
          setShowStepForm(false);
          loadSteps();
        } else {
          alert(response.message || '更新失败');
        }
      } else {
        // 创建步骤时也要确保包含所有字段
        // 将弹窗配置数组转换为JSON字符串
        const popupConfigsJson = JSON.stringify(popupConfigs);
        
        const createData: any = {
          step_order: formData.step_order,
          step_type: formData.step_type,
          title: formData.title,
          description: formData.description,
          guide_content: formData.guide_content || '',
          scenario_list_title: formData.scenario_list_title || '',
          scenario_list_content: formData.scenario_list_content || '',
          popup_configs: popupConfigsJson,
          icon: formData.icon,
          courage_text: formData.courage_text || '',
        };
        console.log('发送创建数据:', createData);
        const response = await adminAPI.createExposureStep(module.id, createData);
        if (response.code === 0) {
          alert('创建成功');
          setShowStepForm(false);
          loadSteps();
        } else {
          alert(response.message || '创建失败');
        }
      }
    } catch (error: any) {
      console.error('提交失败:', error);
      alert(error.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const stepTypeOptions = [
    { value: 'approach', label: '搭讪/接近' },
    { value: 'conversation', label: '对话' },
    { value: 'upload', label: '录制/上传视频' },
    { value: 'analysis', label: 'AI分析' },
    { value: 'profile', label: '个人主页' },
    { value: 'community', label: '感悟广场' },
    { value: 'select-scenario', label: '选择场合' },
    { value: 'brave-approach', label: '勇敢搭讪' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <h2 className="text-xl font-bold">
            管理步骤 - {module.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            为该场景配置练习步骤
          </p>
        </div>

        <div className="p-6">
          {!showStepForm ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">步骤列表</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    拖拽左侧图标可调整步骤顺序
                  </p>
                </div>
                <Button onClick={handleAddStep} icon={<Plus size={16} />} size="small">
                  添加步骤
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无步骤，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, step.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, step.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, step.id)}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-all cursor-move ${
                        draggedStepId === step.id 
                          ? 'opacity-50 bg-gray-100' 
                          : dragOverStepId === step.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                          <GripVertical className="text-gray-400" size={20} />
                        </div>
                        <div className="flex-shrink-0 text-2xl">{step.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              步骤 {step.step_order}: {step.title}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {stepTypeOptions.find(opt => opt.value === step.step_type)?.label || step.step_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditStep(step)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button variant="default" onClick={onClose}>
                  关闭
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmitStep} className="space-y-4">
              <h3 className="font-semibold mb-4">
                {editingStep ? '编辑步骤' : '添加步骤'}
              </h3>

              <FormItem label="步骤顺序" required>
                <Input
                  type="number"
                  value={formData.step_order}
                  onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) || 1 })}
                  placeholder="步骤顺序"
                />
              </FormItem>

              <FormItem label="步骤类型" required>
                <Select
                  value={formData.step_type}
                  onChange={(e) => setFormData({ ...formData, step_type: e.target.value })}
                  options={stepTypeOptions}
                />
              </FormItem>

              <FormItem label="标题" required>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例如: 和别人搭讪帮助别人"
                />
              </FormItem>

              <FormItem label="描述" required>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="例如: 主动寻找需要帮助的人，勇敢地走上前去提供帮助"
                  rows={3}
                />
              </FormItem>

              <FormItem label="执行指南内容">
                <Textarea
                  value={formData.guide_content}
                  onChange={(e) => setFormData({ ...formData, guide_content: e.target.value })}
                  placeholder="详细说明如何执行这个步骤，用户点击开始执行后会看到这个内容。如果不填写，将使用描述作为默认内容。"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  支持多行文本，可以包含详细的执行步骤、注意事项等
                </p>
              </FormItem>

              <FormItem label="语音鼓励认知（可选，给用户播放的一句话）">
                <Textarea
                  value={formData.courage_text}
                  onChange={(e) => setFormData({ ...formData, courage_text: e.target.value })}
                  placeholder="例如：就算有点卡壳也没关系，你已经比昨天更勇敢了。"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  这里的一句话会优先用于生成语音鼓励；不填则自动从执行指南里截取。
                </p>
              </FormItem>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-sm text-blue-600">弹窗配置（可选）</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      配置后，执行指南中的关键词会变成蓝色可点击文字，点击后显示弹窗。可以配置多个弹窗。
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="small"
                    onClick={() => {
                      setPopupConfigs([...popupConfigs, { keywords: '', title: '', content: '' }]);
                    }}
                    icon={<Plus size={16} />}
                  >
                    添加弹窗
                  </Button>
                </div>

                {popupConfigs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                    暂无弹窗配置，点击上方"添加弹窗"按钮添加
                  </div>
                ) : (
                  <div className="space-y-4">
                    {popupConfigs.map((config, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">弹窗配置 {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPopupConfigs(popupConfigs.filter((_, i) => i !== index));
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <FormItem label="需要高亮的关键词">
                          <Input
                            value={config.keywords}
                            onChange={(e) => {
                              const newConfigs = [...popupConfigs];
                              newConfigs[index].keywords = e.target.value;
                              setPopupConfigs(newConfigs);
                            }}
                            placeholder="例如: 帮助他人,录制视频（用逗号分隔）"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            在"执行指南内容"中出现的这些关键词会变成蓝色可点击文字
                          </p>
                        </FormItem>

                        <FormItem label="弹窗标题">
                          <Input
                            value={config.title}
                            onChange={(e) => {
                              const newConfigs = [...popupConfigs];
                              newConfigs[index].title = e.target.value;
                              setPopupConfigs(newConfigs);
                            }}
                            placeholder="例如: 帮助他人说明"
                          />
                        </FormItem>

                        <FormItem label="弹窗内容">
                          <Textarea
                            value={config.content}
                            onChange={(e) => {
                              const newConfigs = [...popupConfigs];
                              newConfigs[index].content = e.target.value;
                              setPopupConfigs(newConfigs);
                            }}
                            placeholder="弹窗显示的详细内容，支持多行文本"
                            rows={4}
                          />
                        </FormItem>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormItem label="图标" required>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="例如: 👋"
                />
              </FormItem>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="default" onClick={() => setShowStepForm(false)}>
                  取消
                </Button>
                <Button type="submit" loading={loading}>
                  {editingStep ? '更新' : '创建'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExposureStepsModal;
