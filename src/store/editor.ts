import { defineStore } from 'pinia'
import { ComponentType} from '@/type/index'
import type { PageMeta, ComponentData, ComponentStyle, ComponentEvent , PageData, PageStyle, Command} from '@/type/index.ts'
import { getComponentProtocol } from '@/components/components/registry'
import { ref, computed } from 'vue'
import { useHistoryStore } from '@/store/history'

const schemaVersion = '2026'

const deepClone = <T>(value: T): T  =>JSON.parse(JSON.stringify(value))//深拷贝函数
const generateComponentId = ():string  =>`comp_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`//生成组件ID
const generatePageId = ():string =>`page_${Date.now()}` //生成页面ID

const createPageMeta = (title='营销页面'): PageMeta => ({
    title,
    description: '面向营销活动与落地页场景的低代码页面',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: schemaVersion,
    scene: 'marketing'
})
const createComponent = (
    type: ComponentType,
    overrides: {
      style?: Partial<ComponentStyle>
      props?: Record<string, unknown>
      events?: ComponentEvent[]
      name?: string
    } = {}
  ): ComponentData => {
    const protocol = getComponentProtocol(type)
    if (!protocol) {
      throw new Error(`未知组件类型: ${type}`)
    }

    return {
      id: generateComponentId(),
      type,
      name: overrides.name || protocol.label,
      schemaVersion,
      style: {
        ...deepClone(protocol.defaultStyle),
        ...deepClone(overrides.style || {})
      },
      props: {
        ...deepClone(protocol.defaultProps),
        ...deepClone(overrides.props || {})
      } as ComponentData['props'],
      events: deepClone(overrides.events || [{ type: 'click', config: { action: 'none', newTab: false } }])
    }
  }

  //创建初始页面
  const createDefaultPage = (title = '营销活动页'): PageData => ({
    id: generatePageId(),
    meta: createPageMeta(title),
    components: [],
    style: {
      width: 1200,
      height: 820,
      backgroundColor: '#f9fafb',
      backgroundImage: ''
    }
  })

  //限制组件不能超过画布
  const clampComponent = (component: ComponentData, page: PageData): ComponentData => {
    const next = deepClone(component)          // 不直接改原对象

    const maxWidth = Math.max(120, page.style.width)    // 画布有效宽
    const maxHeight = Math.max(120, page.style.height)  // 画布有效高

    // 组件不能比画布还大
    next.style.width = Math.min(next.style.width, maxWidth)
    next.style.height = Math.min(next.style.height, maxHeight)

    // left 不能小于 0（超出左边界）
    // left 不能大于 (画布宽 - 组件宽)（超出右边界）
    next.style.left = Math.max(0, Math.min(next.style.left, maxWidth - next.style.width))
    next.style.top = Math.max(0, Math.min(next.style.top, maxHeight - next.style.height))

    return next
  }
  //限制页面样式
 const normalizePage = (page: PageData): PageData => {
    const next = deepClone(page)

    next.style.width = Math.max(next.style.width || 1200, 960)
    next.style.height = Math.max(next.style.height || 820, 720)

    next.style.backgroundColor = next.style.backgroundColor || '#f9fafb'
    next.style.backgroundImage = next.style.backgroundImage || ''

    next.meta.version = schemaVersion

    next.components = next.components.map((comp, index) => {
      const clamped = clampComponent(comp, next)
      clamped.style.zIndex = index + 1    // 按数组顺序重新编号
      return clamped
    })

    return next
  }

export const useEditorStore = defineStore('editor', () => {
    const historyStore = useHistoryStore()
    const localStorageKey = 'lowcode_editor'

    const currentPage = ref<PageData | null>(null)
    const currentComponentId = ref<string | null>(null)
    const canvasScale = ref<number>(1)//画布缩放比例
    const snapEnabled = ref<boolean>(false)//网格吸附开关

    const currentComponent = computed<ComponentData | null>(() => {
        if (!currentPage.value || !currentComponentId.value) return null   
        return currentPage.value.components.find(c => c.id === currentComponentId.value) || null
    })

    //将数据保存到本地
    const persistPage = () => {
        if(!currentPage.value) return

        localStorage.setItem(localStorageKey, JSON.stringify(currentPage.value))
    }
    //新建空白页面页面
    const createNewPage = (title='未命名页面') => {
        currentPage.value = normalizePage(createDefaultPage(title))
        currentComponentId.value = null
        historyStore.clearHistory()
        persistPage()//保存页面
    }
    //更新页面的更新时间
    const touchMeta = () => {
        if(currentPage.value) {
            currentPage.value.meta.updatedAt = new Date().toISOString()
        }
    }
    //修改页面元信息
    const updatePageMeta = (updates: Partial<PageMeta>) => {
        if(!currentPage.value) return

        currentPage.value.meta = { ...currentPage.value.meta, ...updates }
        touchMeta()//更新时间
    }
    //修改页面样式
    const updatePageStyle = (updates: Partial<PageStyle>) => {
        if(!currentPage.value) return
        currentPage.value.style = { ...currentPage.value.style, ...updates }
        touchMeta()
    }


    //自动创建页面
    const ensurePage = () => {
        if (!currentPage.value) createNewPage()
    }
    //向画布添加组件
    const addComponent = (type: ComponentType, overrides?: { style?: Partial<ComponentStyle> }) => {
        ensurePage()
        if (!currentPage.value) return

        const zIndex = currentPage.value.components.length + 1
        const component = createComponent(type, { style: { zIndex, ...overrides?.style } })

        const command: Command = {
          label: `新增${component.type}`,
          execute: () => {
            if (!currentPage.value) return
            const normalized = clampComponent(component, currentPage.value)
            currentPage.value.components.push(normalized)
            currentComponentId.value = normalized.id
            touchMeta()
          },
          undo: () => {
            if (!currentPage.value) return
            const index = currentPage.value.components.findIndex((item) => item.id === component.id)
            if (index >= 0) currentPage.value.components.splice(index, 1)
            if (currentComponentId.value === component.id) currentComponentId.value = null
            touchMeta()
          }
        }

        historyStore.executeCommand(command)
    }
    //选择组件
    const selectComponent = (id: string | null) => {
        currentComponentId.value = id
    }
    //删除组件
    const removeComponent = (id: string) => {
        if (!currentPage.value) return

        const index = currentPage.value.components.findIndex(c => c.id === id)
        if (index < 0) return

        //  删除前深拷贝组件快照，undo 恢复时用
        const snapshot = deepClone(currentPage.value.components[index])
        const wasSelected = currentComponentId.value === id

        const command: Command = {
            label: `删除 ${snapshot.name}`,

            execute: () => {
                if (!currentPage.value) return
                const idx = currentPage.value.components.findIndex(c => c.id === id)
                if (idx < 0) return
                currentPage.value.components.splice(idx, 1)
                if (wasSelected) currentComponentId.value = null
                touchMeta()
            },

            undo: () => {
                if (!currentPage.value) return
                currentPage.value.components.push(snapshot)
                if (wasSelected) currentComponentId.value = snapshot.id
                touchMeta()
            }
        }

        historyStore.executeCommand(command)
    }

    //修改图层位置
    const moveLayer = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
        if (!currentPage.value) return
        const components = currentPage.value.components
        const index = components.findIndex(c => c.id === id)
        if (index < 0) return

        const itemName = components[index].name

        // 计算目标索引
        const targetIndex = (() => {
            switch (direction) {
                case 'up':    return index + 1
                case 'down':  return index - 1
                case 'top':   return components.length - 1
                case 'bottom': return 0
            }
        })()

        historyStore.executeCommand({
            label: `移动图层 ${itemName}`,
            execute: () => {
                if (!currentPage.value) return
                const list = currentPage.value.components
                const idx = list.findIndex(c => c.id === id)
                if (idx < 0) return
                const [moved] = list.splice(idx, 1)
                if (!moved) return
                list.splice(targetIndex, 0, moved)
                list.forEach((c, i) => { c.style.zIndex = i + 1 })
                touchMeta()
            },
            undo: () => {
                if (!currentPage.value) return
                const list = currentPage.value.components
                const idx = list.findIndex(c => c.id === id)
                if (idx < 0) return
                const [moved] = list.splice(idx, 1)
                if (!moved) return
                list.splice(index, 0, moved)
                list.forEach((c, i) => { c.style.zIndex = i + 1 })
                touchMeta()
            }
        })
    }
    
    //修改组件样式
    const updateComponentStyle = (id: string, updates: Partial<ComponentStyle>) => {
        if(!currentPage.value) return
        const component = currentPage.value.components.find(item => item.id === id)
        if(!component) return
        const prevStyle = deepClone(component.style)
        const newStyle = clampComponent(
            { ...component, style: { ...component.style, ...updates } },
            currentPage.value
        ).style

        historyStore.executeCommand({
          label: '更新组件样式',
          execute: () => {
            component.style = { ...newStyle }
            touchMeta()
          },
          undo: () => {
            component.style = { ...prevStyle }
            touchMeta()
          }
        })
    }
    //修改组件属性
    const updateComponentProps = (id: string, updates: Record<string, unknown>) => {
        if(!currentPage.value) return
        const component = currentPage.value.components.find(item => item.id === id)
        if(!component) return
        const prevProps = { ...component.props }
        const newProps = { ...component.props, ...updates }

        historyStore.executeCommand({
          label: '更新组件属性',
          execute: () => {
            component.props = { ...newProps } as ComponentData['props']
            touchMeta()
          },
          undo: () => {
            component.props = { ...prevProps } as ComponentData['props']
            touchMeta()
          }
        })
    }
    // 修改组件名称
    const updateComponentName = (id: string, name: string) => {
        if (!currentPage.value) return
        const component = currentPage.value.components.find(item => item.id === id)
        if (!component) return

        const oldName = component.name

        historyStore.executeCommand({
            label: `重命名 ${oldName} → ${name}`,
            execute: () => {
                const comp = currentPage.value?.components.find(c => c.id === id)
                if (comp) comp.name = name
                touchMeta()
            },
            undo: () => {
                const comp = currentPage.value?.components.find(c => c.id === id)
                if (comp) comp.name = oldName
                touchMeta()
            }
        })
    }
    //修改组件事件
    const updateComponentEvents = (id: string, events: ComponentEvent[]) => {
        if(!currentPage.value) return
        const component = currentPage.value.components.find(item => item.id === id)
        if(!component) return

        const prevEvents = deepClone(component.events)
        const newEvents = deepClone(events)

        historyStore.executeCommand({
          label: '更新组件事件',
          execute: () => {
            component.events = deepClone(newEvents)
            touchMeta()
          },
          undo: () => {
            component.events = deepClone(prevEvents)
            touchMeta()
          }
        })
    }
    //通过方向键移动组件的位置
    const nudgeComponent = (id: string, dx: number, dy: number) => {
        if(!currentPage.value) return
        const component = currentPage.value.components.find(item => item.id === id)
        if(!component) return

        const oldLeft = component.style.left
        const oldTop = component.style.top
        const newLeft = Math.max(0, component.style.left + dx)
        const newTop = Math.max(0, component.style.top + dy)

        historyStore.executeCommand({
            label: `移动 ${component.name}`,
            execute: () => {
                const comp = currentPage.value?.components.find(c => c.id === id)
                if (comp) {
                    comp.style.left = newLeft
                    comp.style.top = newTop
                }
                touchMeta()
            },
            undo: () => {
                const comp = currentPage.value?.components.find(c => c.id === id)
                if (comp) {
                    comp.style.left = oldLeft
                    comp.style.top = oldTop
                }
                touchMeta()
            }
        })
    }

    //从本地获取数据
    const loadPersistPage = () => {
        const page = localStorage.getItem(localStorageKey)

        if(!page) {
            createNewPage()
            return
        }

        try{
            currentPage.value = normalizePage(JSON.parse(page) as PageData)
            currentComponentId.value = null
        } catch {
            createNewPage()
        }
    }

    //导出页面
    const exportPageData = (): string | null => {
        if(!currentPage.value) return null
        return JSON.stringify(currentPage.value, null, 2)//null表示不保留、2表示JSON格式化缩进
    }
    //导入页面
    const importPageData = (loadingData: string)  => {
        try{
          currentPage.value = normalizePage(JSON.parse(loadingData) as PageData)
          currentComponentId.value = null
          historyStore.clearHistory()
          touchMeta()
        } catch {
          alert('导入失败')
        }
    }


    return {
        localStorageKey,
        currentPage: computed(() => currentPage.value),//防止外部修改currentPage的值
        currentComponent,
        currentComponentId: computed(() => currentComponentId.value),
        canvasScale: computed(() => canvasScale.value),
        snapEnabled: computed(() => snapEnabled.value),
        setSnapEnabled: (v: string | number | boolean) => { snapEnabled.value = Boolean(v) },
        createNewPage,
        updatePageMeta,
        updatePageStyle,

        addComponent,
        selectComponent,
        removeComponent,
        moveLayer,

        updateComponentStyle,
        updateComponentProps,
        updateComponentName,
        updateComponentEvents,
        nudgeComponent,

        persistPage,
        loadPersistPage,

        exportPageData,
        importPageData,
        
        setCanvasScale: (v: number) => { canvasScale.value = v },
        touchMeta
      }
})