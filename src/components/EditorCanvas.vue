<template>
  <div
    ref="canvasRef"
    class="editor-canvas"
    tabindex="0"
    @keydown="handleKeydown"
    @click.self="editorStore.selectComponent(null)"
  >
    <!-- 画布容器：支持缩放 -->
    <div class="canvas-stage" >
      <!-- 网格线背景，始终显示 -->
      <div class="canvas-grid"></div>

      <div
        v-if="editorStore.currentPage"
        class="canvas-background"
        :style="canvasBgStyle"
        @click.self="editorStore.selectComponent(null)"
        @contextmenu.prevent="openContextMenu"
        @dragover.prevent @drop="handleDrop"
      >
        <!-- 动态渲染组件 -->
        <div
          v-for="comp in sortedComponents"
          :ref="setWrapperRef(comp.id)"
          :key="comp.id"
          class="component-wrapper"
          :class="{ selected: comp.id === editorStore.currentComponentId }"
          :style="wrapperStyle(comp)"
          @click.stop="editorStore.selectComponent(comp.id)"
          @contextmenu.stop.prevent="openContextMenu($event, comp)"
        >
          <!-- 实际组件内容 -->
          <component :is="getRenderer(comp.type)" :component="comp" class="component-content" />
          <!-- 选中高亮框 -->
          <div v-if="comp.id === editorStore.currentComponentId" class="selection-box">
            <span class="selection-label">{{ comp.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop="contextMenu.visible = false"
      >
        <div class="menu-item" @click="handleDelete">
          <el-icon><Delete /></el-icon>
          <span>删除 Ctrl + Delete</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMoveLayer('top')">
          <el-icon><Top /></el-icon>
          <span>置顶</span>
        </div>
        <div class="menu-item" @click="handleMoveLayer('up')">
          <el-icon><ArrowUp /></el-icon>
          <span>上移一层</span>
        </div>
        <div class="menu-item" @click="handleMoveLayer('down')">
          <el-icon><ArrowDown /></el-icon>
          <span>下移一层</span>
        </div>
        <div class="menu-item" @click="handleMoveLayer('bottom')">
          <el-icon><ArrowDown /></el-icon>
          <span>置底</span>
        </div>
      </div>
    </Teleport>

    <Moveable
      ref="moveableRef"
      v-if="selectedElement"
      :target="selectedElement"
      :draggable="true"
      :resizable="true"
      :rotatable="true"
      :zoom="moveableZoom"
      :origin="false"

      :snappable="editorStore.snapEnabled"
      :snapGridWidth="20"        
      :snapGridHeight="20"       
      :snapThreshold="10"          
      :isDisplaySnapDigit="true" 

      :elementGuidelines="snapTargetEles"
      :isDisplayInnerSnapDigit="true"
      :elementSnapDirections="{ top: true, left: true, right: true, bottom: true, center: true, middle: true }"
      :snapDirections="{ top: true, left: true, right: true, bottom: true, center: true, middle: true }"

      @drag="moveableEvents.onDrag"
      @drag-end="moveableEvents.onDragEnd"
      @resize="moveableEvents.onResize"
      @resize-end="moveableEvents.onResizeEnd"
      @rotate="moveableEvents.onRotate"
      @rotate-end="moveableEvents.onRotateEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import Moveable from 'vue3-moveable'
import { useEditorStore } from '@/store/editor'
import { useHistoryStore } from '@/store/history'
import type { ComponentData } from '@/type'
import { ComponentType } from '@/type'
import { componentRendererMap } from './components/registry'
import { Delete, Top, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

import { useMoveable } from '@/composables/useMoveable'

const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const canvasRef = ref<HTMLElement | null>(null)
const moveableRef = ref<InstanceType<typeof Moveable> | null>(null)
const { setWrapperRef, selectedElement, moveableZoom, moveableEvents, snapTargetEles } = useMoveable(editorStore)

// 在控制面板中更改属性时同步更新 Moveable 控制框
watch(
  () => {
    const component = editorStore.currentComponent
    if (!component) return null
    return JSON.stringify(component.style)
  },
  () => {
    nextTick(() => moveableRef.value?.updateTarget())
  }
)

// 新建页面后自动聚焦画布，让键盘事件生效
watch(
  () => editorStore.currentPage,
  (page) => {
    if (page) {
      nextTick(() => canvasRef.value?.focus())
    }
  }
)

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  componentId: null as string | null
})
//按zIndex排序
const sortedComponents = computed(() => {
  const list = editorStore.currentPage?.components || []
  return [...list].sort((a, b) => a.style.zIndex - b.style.zIndex)
})

//画布尺寸
const pageWidth = computed(() => editorStore.currentPage?.style.width || 1200)
const pageHeight = computed(() => editorStore.currentPage?.style.height || 820)

// canvas-background 样式：使用 transform: scale 实现缩放
const canvasBgStyle = computed(() => ({
  width: `${pageWidth.value}px`,
  height: `${pageHeight.value}px`,
  backgroundColor: editorStore.currentPage?.style.backgroundColor || '#f9fafb',
  backgroundImage: editorStore.currentPage?.style.backgroundImage || 'none',
  transform: `scale(${editorStore.canvasScale})`,
  transformOrigin: 'center center'
}))

// 组件渲染，从注册中心拿数据，返回对应的组件
const getRenderer = (type: ComponentType) => {
  return componentRendererMap[type]
}

// 将数据转化为对应的 css 样式
const wrapperStyle = (comp: ComponentData) => ({
  top: `${comp.style.top}px`,
  left: `${comp.style.left}px`,
  width: `${comp.style.width}px`,
  height: `${comp.style.height}px`,
  zIndex: comp.style.zIndex,
  ...(comp.style.rotate ? { transform: `rotate(${comp.style.rotate}deg)` } : {})
})

// 右键菜单
const openContextMenu = (event: MouseEvent, comp?: ComponentData) => {
  if (comp) {
    editorStore.selectComponent(comp.id)
    contextMenu.componentId = comp.id
  }
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.visible = true
}

/** 关闭菜单的全局点击监听 */
const closeMenu = () => {
  contextMenu.visible = false
}
onMounted(() => {
  document.addEventListener('click', closeMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

const handleDelete = () => {
  if (contextMenu.componentId) {
    editorStore.removeComponent(contextMenu.componentId)
  }
}

const handleMoveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
  if (contextMenu.componentId) {
    editorStore.moveLayer(contextMenu.componentId, direction)
  }
}


// 键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+Z 撤销（不依赖组件选中）
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault()
    historyStore.undo()
    return
  }
  // Ctrl+Y 或 Ctrl+Shift+Z 重做
  if (event.ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault()
    historyStore.redo()
    return
  }

  const id = editorStore.currentComponentId
  if (!id) return
  // delete 删除组件
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    editorStore.removeComponent(id)
    return
  }

  const step = event.shiftKey ? 10 : 1
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      editorStore.nudgeComponent(id, 0, -step)
      break
    case 'ArrowDown':
      event.preventDefault()
      editorStore.nudgeComponent(id, 0, step)
      break
    case 'ArrowLeft':
      event.preventDefault()
      editorStore.nudgeComponent(id, -step, 0)
      break
    case 'ArrowRight':
      event.preventDefault()
      editorStore.nudgeComponent(id, step, 0)
      break
  }
}

const handleDrop = (event: DragEvent) => {
    event.preventDefault()  // 阻止默认行为
    
    const componentType = event.dataTransfer!.getData('componentType') as ComponentType
    if (!componentType) return
    const bg = event.currentTarget as HTMLElement
    const rect = bg.getBoundingClientRect()
    const left = (event.clientX - rect.left) / editorStore.canvasScale
    const top = (event.clientY - rect.top) / editorStore.canvasScale

    editorStore.addComponent(componentType, { style: { left, top } })
}
</script>

<style scoped>
.editor-canvas {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  overflow: hidden;
  outline: none;
}

.canvas-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  overflow: auto;
}

/* 网格线背景 — 始终显示 */
.canvas-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

.canvas-background {
  position: relative;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid #3c3c3c;
  overflow: hidden;
  flex-shrink: 0;
}

/* 组件包裹层 */
.component-wrapper {
  position: absolute;
  cursor: pointer;
  user-select: none;
}
.component-wrapper:hover {
  outline: 1px dashed rgba(59, 130, 246, 0.5);
}

/* 组件内容 */
.component-content {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 选中标签定位容器 */
.selection-box {
  position: absolute;
  inset: -2px;
  pointer-events: none;
}

.selection-label {
  position: absolute;
  top: -24px;
  left: 0;
  height: 20px;
  line-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  background: #2563eb;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background-color: #2d2d30;
  border-radius: 4px;
  padding: 4px 0;
  min-width: 160px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  border: 1px solid #3c3c3c;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  color: #ccc;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #3c3c3c;
}

.menu-divider {
  height: 1px;
  background-color: #3c3c3c;
  margin: 4px 0;
}
</style>
