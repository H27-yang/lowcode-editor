<template>
    <div class="container">
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="tool-btn" title="新建" @click="editorStore.createNewPage()">
                    <el-icon><Plus /></el-icon>
                </div>
                <div class="tool-divider" ></div>
                <div class="tool-btn" title="保存" @click="editorStore.persistPage()">
                    <el-icon><Document /></el-icon>
                </div>
                <div class="tool-divider"></div>

                <div class="tool-btn" :class="{ 'tool-btn-disabled': !historyStore.canUndo }" title="撤销" @click="historyStore.undo()">
                    <el-icon><RefreshLeft /></el-icon>
                </div>
                <div class="tool-divider"></div>
                <div class="tool-btn" :class="{ 'tool-btn-disabled': !historyStore.canRedo }" title="重做" @click="historyStore.redo()">
                    <el-icon><RefreshRight /></el-icon>
                </div>
                <div class="tool-divider"></div>
                <div class="tool-btn" title="导入" @click="fileInputRef?.click()">
                    <el-icon><Upload /></el-icon>
                </div>
                <!-- 文件选择器 -->
                <input
                    ref="fileInputRef"
                    type="file"
                    accept=".json"
                    style="display: none"
                    @change="handleImport"
                />
                <div class="tool-divider"></div>
                <div class="tool-btn" title="导出" @click="handleExport()">
                    <el-icon><Download /></el-icon>
                </div>

                <div class="tool-divider"></div>
                <div class="tool-btn" title="预览" @click="previewVisible=true">
                    <el-icon><View /></el-icon>
                </div>
                
                <div class="tool-divider"></div>
                <el-switch
                    :model-value="editorStore.snapEnabled"
                    active-text="网格吸附"
                    @change="(val: boolean | string | number) => editorStore.setSnapEnabled(val)"
                />
            </div>
            
        </div>
        <div class="content">
            <ComponentPanel />
            <EditorCanvas />
            <PropertyPanel />
        </div>
        <!-- 弹窗 -->
        <el-dialog v-model="previewVisible" title="页面预览" width="90%" top="4vh" destroy-on-close>
        <div class="preview-content" :style="previewContainerStyle">
        <div
            v-for="comp in previewComponents"
            :key="comp.id"
            class="preview-item"
            :style="previewItemStyle(comp)"
        >
            <component :is="getPreviewRenderer(comp.type)" :component="comp" />
        </div>
        </div>
    </el-dialog>
        <div class="status-bar">
            <div class="status-left"></div>
            <div class="status-center">
                <span class="status-item">画布缩放</span>
                <el-slider v-model="zoom" :min="25" :max="200" :step="1" class="zoom-slider" />
                <span class="status-item">{{ zoom }}%</span>
            </div>
            <div class="status-right"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent} from 'vue'

import { Plus, Document, Download, Upload, RefreshLeft, RefreshRight,  View} from '@element-plus/icons-vue'
import { useEditorStore } from '@/store/editor'
import { useHistoryStore } from '@/store/history'
import { componentRendererMap } from '@/components/components/registry'
import type { ComponentData } from '@/type/index'
import  {ComponentType } from '@/type/index'

const ComponentPanel = defineAsyncComponent(() => import('@/components/ComponentPanel.vue'))
const PropertyPanel = defineAsyncComponent(() => import('@/components/PropertyPanel.vue'))
const EditorCanvas = defineAsyncComponent(() => import('@/components/EditorCanvas.vue'))
const editorStore = useEditorStore()
const historyStore = useHistoryStore()
const zoom = computed({
    get: () => Math.round(editorStore.canvasScale * 100),  // 读：store → slider 显示
    set: (v: number) => editorStore.setCanvasScale(v / 100) // 写：slider 拖 → store   
  })

const previewVisible = ref(false)
//导出
const handleExport = () => {
    const pageData = editorStore.exportPageData()
    if(!pageData)  return

    const blob = new Blob([pageData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${editorStore.currentPage?.meta.title || 'page'}.json`//文件名
    link.click()
    URL.revokeObjectURL(url)//下载完释放
}
//导入
const fileInputRef = ref<HTMLInputElement | null>(null)
const handleImport = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if(!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        const text = e.target?. result as string
        try {
            editorStore.importPageData(text)
        } catch {
            alert('导入失败, JSON 格式不正确')
        }
        input.value = ''
    }
    reader.readAsText(file)//触发onload回调函数
}

// 预览用的组件列表 & 样式
const previewComponents = computed(() => {
    const list = editorStore.currentPage?.components || []
    return [...list].sort((a, b) => a.style.zIndex - b.style.zIndex)
  })

  // 预览画布容器样式
  const previewContainerStyle = computed(() => ({
    width: `${editorStore.currentPage?.style.width || 1200}px`,
    height: `${editorStore.currentPage?.style.height || 820}px`,
    backgroundColor: editorStore.currentPage?.style.backgroundColor || '#f9fafb',
    position: 'relative' as const,
    margin: '0 auto',
    overflow: 'hidden',
    borderRadius: '12px'
  }))

  // 预览中每个组件的位置
  const previewItemStyle = (comp: ComponentData) => ({
    position: 'absolute' as const,
    top: `${comp.style.top}px`,
    left: `${comp.style.left}px`,
    width: `${comp.style.width}px`,
    height: `${comp.style.height}px`,
    zIndex: comp.style.zIndex,
    transform: comp.style.rotate ? `rotate(${comp.style.rotate}deg)` : undefined
  })

  // 预览用的渲染器（和画布同一套）
  const getPreviewRenderer = (type: ComponentType) => {
    return componentRendererMap[type] || componentRendererMap[ComponentType.Text]
  }

  
</script>

<style scoped>
.container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #1e1e1e;
    overflow: hidden;
}

.toolbar {
    height: 32px;
    background-color: #2d2d30;
    border-bottom: 1px solid #3c3c3c;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 2px;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 2px;
}

.tool-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    cursor: pointer;
    color: #ccc;
    transition: background-color 0.2s, color 0.2s;
}

.tool-btn:hover {
    background-color: #3c3c3c;
    color: #fff;
}

.tool-btn-active {
    background-color: #007acc;
    color: #fff;
}

.tool-btn-disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
}

.tool-divider {
    width: 1px;
    height: 18px;
    background-color: #3c3c3c;
    margin: 0 4px;
}

.content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.status-bar {
    height: 24px;
    /* background-color: #007acc; */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    font-size: 12px;
    color: #fff;
}

.status-center {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-item {
    font-size: 11px;
}

.zoom-slider {
    width: 120px;
}
</style>