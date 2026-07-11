import { ComponentType } from '@/type/index'
import type { ComponentProtocol } from '@/type/index'

import TextComponent from './TextComponent.vue'
import ImageComponent from './ImageComponent.vue'
import ButtonComponent from './ButtonComponent.vue'
import InputComponent from './InputComponent.vue'
import FormComponent from './FormComponent.vue'

export const componentRendererMap = {
    [ComponentType.Text]: TextComponent,
    [ComponentType.Image]: ImageComponent,
    [ComponentType.Button]: ButtonComponent,
    [ComponentType.Input]: InputComponent,
    [ComponentType.Form]: FormComponent
  }

//定义组件默认配置 import('moveable').then(m => console.log('Moveable OK', m.default))
export const componentProtocols: ComponentProtocol[] = [
{
    type: ComponentType.Text,
    label: '标题',
    category: '基础',
    description: '适合主标题、卖点描述、活动文案。',
    defaultStyle: {
    top: 80,
    left: 80,
    width: 320,
    height: 72,
    zIndex: 1,
    rotate: 0,
    opacity: 1,
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.4,
    color: '#111827',
    textAlign: 'left',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: '#d1d5db',
    borderRadius: 0
    },
    defaultProps: {
    content: '2026 春季营销活动主标题'
    },
    schema: [
    { key: 'content', label: '文本内容', type: 'string' }
    ]
},
{
    type: ComponentType.Image,
    label: '图片',
    category: '基础',
    description: '适合 banner、商品图、KV 视觉。',
    defaultStyle: {
    top: 180,
    left: 80,
    width: 360,
    height: 220,
    zIndex: 2,
    rotate: 0,
    opacity: 1,
    backgroundColor: '#f3f4f6',
    borderWidth: 0,
    borderColor: '#d1d5db',
    borderRadius: 16
    },
    defaultProps: {
    src: '',
    alt: '活动图片',
    objectFit: 'cover'
    },
    schema: [
    { key: 'src', label: '图片地址', type: 'string' },
    { key: 'objectFit', label: '填充模式', type: 'select', options: ['cover', 'contain', 'fill'] }
    ]
},
{
    type: ComponentType.Button,
    label: '按钮',
    category: '营销',
    description: '适合 CTA、立即参与、立即咨询。',
    defaultStyle: {
    top: 430,
    left: 80,
    width: 220,
    height: 48,
    zIndex: 3,
    rotate: 0,
    opacity: 1,
    fontSize: 16,
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#7c3aed',
    borderWidth: 0,
    borderColor: '#7c3aed',
    borderRadius: 999
    },
    defaultProps: {
    content: '立即报名',
    type: 'primary'
    },
    schema: [
    { key: 'content', label: '按钮文案', type: 'string' }
    ]
},
{
    type: ComponentType.Input,
    label: '输入框',
    category: '营销',
    description: '适合手机号、邮箱、姓名收集。',
    defaultStyle: {
    top: 500,
    left: 80,
    width: 280,
    height: 44,
    zIndex: 4,
    rotate: 0,
    opacity: 1,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dcdfe6',
    borderRadius: 10
    },
    defaultProps: {
    placeholder: '请输入手机号',
    value: '',
    inputType: 'tel'
    },
    schema: [
    { key: 'placeholder', label: '占位文案', type: 'string' },
    { key: 'inputType', label: '输入类型', type: 'select', options: ['text', 'email', 'tel', 'number'] }
    ]
},
{
    type: ComponentType.Form,
    label: '表单',
    category: '营销',
    description: '内置字段区块，适合线索收集与活动报名。',
    defaultStyle: {
    top: 160,
    left: 520,
    width: 360,
    height: 380,
    zIndex: 5,
    rotate: 0,
    opacity: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18
    },
    defaultProps: {
    title: '活动报名表单',
    submitText: '立即提交',
    fields: [
        { id: 'name', label: '姓名', type: 'text', placeholder: '请输入姓名', required: true },
        { id: 'mobile', label: '手机号', type: 'tel', placeholder: '请输入手机号', required: true },
        { id: 'email', label: '邮箱', type: 'email', placeholder: '请输入邮箱' }
    ]
    },
    schema: [
    { key: 'title', label: '表单标题', type: 'string' },
    { key: 'submitText', label: '提交按钮文案', type: 'string' },
    { key: 'fields', label: '字段列表', type: 'array' }
    ]
}
]

export const getComponentProtocol = (type: ComponentType) => {
    return componentProtocols.find((item) => item.type === type)
  }