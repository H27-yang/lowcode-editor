//组件类型枚举
export enum ComponentType {
    Text = 'text',
    Image = 'image',
    Button = 'button',
    Input = 'input',
    Form = 'form'
}
//组件属性映射
export type ComponentPropsMap = {
    [ComponentType.Text]: TextProps
    [ComponentType.Image]: ImageProps
    [ComponentType.Button]: ButtonProps
    [ComponentType.Input]: InputProps
    [ComponentType.Form]: FormProps
}
//组件样式
export interface ComponentStyle {
    top: number
    left: number
    width: number
    height: number
    zIndex: number
    rotate: number
    opacity: number
    fontSize?: number
    fontWeight?: number
    lineHeight?: number
    color?: string
    backgroundColor?: string
    borderWidth?: number
    borderColor?: string
    borderRadius?: number
    textAlign?: 'left' | 'center' | 'right'
  }
//组件属性
export interface TextProps {
    content: string
  }
  
  export interface ImageProps {
    src: string
    alt?: string
    objectFit?: 'cover' | 'contain' | 'fill'
  }
  
  export interface ButtonProps {
    content: string
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }
  
  export interface InputProps {
    placeholder: string
    value?: string
    inputType?: 'text' | 'email' | 'tel' | 'number'
  }
  
  export interface FormField {
    id: string
    label: string
    type: 'text' | 'email' | 'tel'
    placeholder: string
    required?: boolean
  }
  export interface FormProps {
    title: string
    submitText: string
    fields: FormField[]
  }
  
  export interface ClickEventAction {
    action: 'none' | 'url' | 'message',
    url?: string,
    message?: string,
    newTab: boolean//是否新窗口打开
  }

  export interface ComponentEvent {
    type: 'click'
    config: ClickEventAction//事件配置
  }

//组件数据
export interface ComponentData<T extends ComponentType = ComponentType> {
    id: string
    type: T
    name: string
    style: ComponentStyle
    props: ComponentPropsMap[T]
    events: ComponentEvent[]
    schemaVersion: string
}


//页面信息
export interface PageMeta {
    title: string
    description: string
    createdAt: string
    updatedAt: string
    version: string
    scene: 'marketing' | 'landing' | 'form'  //使用场景，如营销活动页
}
//页面样式
export interface PageStyle {
    width: number
    height: number
    backgroundColor: string
    backgroundImage?: string
  }
//页面数据
export interface PageData {
    id: string
    meta: PageMeta
    components: ComponentData[] 
    style: PageStyle
  }

  //控件
  export interface ComponentSchemaField {
    key: string
    label: string
    type: 'string' | 'number' | 'color' | 'select' | 'array'
    options?: string[]
  }
  //属性面板
  export interface ComponentProtocol<T extends ComponentType = ComponentType> {
    type: T
    label: string
    category: '基础' | '营销'
    description: string
    defaultStyle: ComponentStyle
    defaultProps: ComponentPropsMap[T]
    schema: ComponentSchemaField[]
  }
  

export interface Command {
  label: string
  execute(): void
  undo(): void
}