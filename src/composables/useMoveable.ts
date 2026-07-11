import { computed, shallowReactive } from 'vue'
import { useEditorStore } from '@/store/editor'

export function useMoveable(editorStore: ReturnType<typeof useEditorStore>) {
  // 用 shallowReactive 让组件挂载/卸载时 selectedElement 能重新计算
  const wrapperEls = shallowReactive<Record<string, HTMLElement>>({})

  // 函数式 ref：挂载时注册，卸载时自动清理
  const setWrapperRef = (id: string) => (el: unknown) => {
    if (el) {
      wrapperEls[id] = el as HTMLElement
    } else {
      delete wrapperEls[id]
    }
  }

  // 当前选中的 DOM 元素
  const selectedElement = computed<HTMLElement | null>(() => {
    const id = editorStore.currentComponentId
    if (!id) return null
    return wrapperEls[id] || null
  })

  // 画布缩放比例（moveable 的 zoom 属性用）
  const moveableZoom = computed(() => editorStore.canvasScale || 1)

  // Moveable 事件回调
  const moveableEvents = {
    // 拖拽中：实时同步到 store，让 Vue 驱动 DOM
    onDrag({ target, left, top }: { target: HTMLElement | SVGElement; left: number; top: number }) {
        target.style.left = `${left}px`
        target.style.top = `${top}px`
    },

    // 拖拽结束：正式提交最终状态
    onDragEnd({ target }: { target: HTMLElement | SVGElement }) {
      const id = editorStore.currentComponentId
      if (!id) return
      const style = target.style
      editorStore.updateComponentStyle(id, {
        left: parseFloat(style.left) || 0,
        top: parseFloat(style.top) || 0
      })
    },

    // 缩放中：实时同步宽高和位置
    onResize({ target, width, height, drag }: any) {
        target.style.width = `${width}px`
        target.style.height = `${height}px`
        target.style.left = `${drag.left}px`
        target.style.top = `${drag.top}px`
    },

    // 缩放结束：正式提交
    onResizeEnd({ target }: { target: HTMLElement | SVGElement }) {
      const id = editorStore.currentComponentId
      if (!id) return
      const style = target.style
      editorStore.updateComponentStyle(id, {
        width: parseFloat(style.width) || 0,
        height: parseFloat(style.height) || 0,
        left: parseFloat(style.left) || 0,
        top: parseFloat(style.top) || 0
      })
    },

    // 旋转中：只操作 DOM
    onRotate({ target, rotate }: { target: HTMLElement | SVGElement; rotate: number }) {
      target.style.transform = `rotate(${rotate}deg)`
    },

    // 旋转结束：正式提交
    onRotateEnd({ target }: { target: HTMLElement | SVGElement }) {
      const id = editorStore.currentComponentId
      if (!id) return
      const transform = target.style.transform
      const match = transform.match(/rotate\(([-\d.]+)deg\)/)
      editorStore.updateComponentStyle(id, {
        rotate: match ? parseFloat(match[1]) : 0
      })
    }
  }

  //返回除了当前组件画布中其他组件的DOM元素
  const snapTargetEles = computed<HTMLElement[]>(() => {
    const currentId = editorStore.currentComponentId
    return Object.entries(wrapperEls)
      .filter(([id]) => id !== currentId)
      .map(([, el]) => el)
  })

  

  return { setWrapperRef, selectedElement, moveableZoom, moveableEvents, snapTargetEles }
}
