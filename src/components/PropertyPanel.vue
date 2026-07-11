<template>
  <div class="property-panel">
    <div class="panel-header">
      <span>{{ currentComponent ? currentComponent.name : '页面属性' }}</span>
      <div class="header-actions">
        <el-icon><Setting /></el-icon>
      </div>
    </div>

    <div class="panel-body" @keydown.enter="handleEnterBlur">
      <!-- ========== 未选中组件：页面属性 ========== -->
      <template v-if="!currentComponent && currentPage">
        <div class="property-item">
          <label>页面标题</label>
          <el-input
            :model-value="currentPage.meta.title"
            size="small"
            class="property-input"
            @update:model-value="(v: string) => editorStore.updatePageMeta({ title: v })"
          />
        </div>
        <div class="property-item">
          <label>宽度</label>
          <el-input
            :model-value="String(currentPage.style.width)"
            size="small"
            class="property-input"
            @update:model-value="(v: string) => editorStore.updatePageStyle({ width: Number(v) || 1200 })"
          />
        </div>
        <div class="property-item">
          <label>高度</label>
          <el-input
            :model-value="String(currentPage.style.height)"
            size="small"
            class="property-input"
            @update:model-value="(v: string) => editorStore.updatePageStyle({ height: Number(v) || 820 })"
          />
        </div>
        <div class="property-item">
          <label>背景色</label>
          <div class="color-picker-wrapper">
            <el-color-picker
              :model-value="currentPage.style.backgroundColor"
              size="small"
              @update:model-value="(v: string | null) => editorStore.updatePageStyle({ backgroundColor: v || '#f9fafb'})"
            />
            <el-input
              :model-value="currentPage.style.backgroundColor"
              size="small"
              class="property-input color-input"
              @update:model-value="(v: string) => editorStore.updatePageStyle({ backgroundColor: v })"
            />
          </div>
        </div>
      </template>

      <!-- ========== 选中组件：组件属性 ========== -->
      <template v-if="currentComponent">
        <!-- 基本信息 -->
        <div class="property-section">基本信息</div>
        <div class="property-item">
          <label>组件名</label>
          <el-input
            :model-value="currentComponent.name"
            size="small"
            class="property-input"
            @update:model-value="(name: string) => editorStore.updateComponentName(currentComponent!.id, name)"
          />
        </div>
        <div class="property-item">
          <label>ID</label>
          <el-input :model-value="currentComponent.id" size="small" class="property-input" readonly disabled />
        </div>

        <!-- 位置 -->
        <div class="property-section">位置</div>
        <div style="display: flex; gap: 8px">
          <div class="property-item" style="flex: 1">
            <label>X</label>
            <el-input
              :model-value="String(currentComponent.style.left)"
              size="small"
              class="property-input"
              @update:model-value="(v: string) => editorStore.updateComponentStyle(currentComponent!.id, { left: Number(v) || 0 })"
            />
          </div>
          <div class="property-item" style="flex: 1">
            <label>Y</label>
            <el-input
              :model-value="String(currentComponent.style.top)"
              size="small"
              class="property-input"
              @update:model-value="(v: string) => editorStore.updateComponentStyle(currentComponent!.id, { top: Number(v) || 0 })"
            />
          </div>
        </div>

        <!-- 尺寸 -->
        <div class="property-section">尺寸</div>
        <div style="display: flex; gap: 8px">
          <div class="property-item" style="flex: 1">
            <label>宽</label>
            <el-input
              :model-value="String(currentComponent.style.width)"
              size="small"
              class="property-input"
              @update:model-value="(v: string) => editorStore.updateComponentStyle(currentComponent!.id, { width: Number(v) || 40 })"
            />
          </div>
          <div class="property-item" style="flex: 1">
            <label>高</label>
            <el-input
              :model-value="String(currentComponent.style.height)"
              size="small"
              class="property-input"
              @update:model-value="(v: string) => editorStore.updateComponentStyle(currentComponent!.id, { height: Number(v) || 40 })"
            />
          </div>
        </div>

        <!-- 外观 -->
        <div class="property-section">外观</div>
        <div class="property-item">
          <label>旋转</label>
          <el-input
            :model-value="String(currentComponent.style.rotate)"
            size="small"
            class="property-input"
            @update:model-value="(v: string) => editorStore.updateComponentStyle(currentComponent!.id, { rotate: Number(v) || 0 })"
          />
        </div>
        <div class="property-item">
          <label>透明度</label>
          <el-slider
            :model-value="currentComponent.style.opacity * 100"
            :min="0"
            :max="100"
            size="small"
            @update:model-value="(v: number | number[]) => editorStore.updateComponentStyle(currentComponent!.id, { opacity: (Array.isArray(v) ? v[0] : v) / 100 })"
          />
        </div>
        <div style="display: flex; gap: 8px">
          <div class="property-item" style="flex: 1">
            <label>背景色</label>
            <el-color-picker
              :model-value="currentComponent.style.backgroundColor || '#ffffff'"
              size="small"
              @update:model-value="(v: string | null) => editorStore.updateComponentStyle(currentComponent!.id, { backgroundColor: v || '#ffffff' })"
            />
          </div>
          <div class="property-item" style="flex: 1">
            <label>文字色</label>
            <el-color-picker
              :model-value="currentComponent.style.color || '#111827'"
              size="small"
              @update:model-value="(v: string | null) => editorStore.updateComponentStyle(currentComponent!.id, { color: v || '#111827' })"
            />
          </div>
        </div>

        <!-- 属性（根据 schema 动态渲染） -->
        <template v-if="componentProtocol">
          <div class="property-section">内容</div>
          <template v-for="field in componentProtocol.schema" :key="field.key">
            <div class="property-item">
              <label>{{ field.label }}</label>
              <!-- 文本 -->
              <el-input
                v-if="field.type === 'string'"
                :model-value="String(componentProps[field.key] || '')"
                size="small"
                class="property-input"
                @update:model-value="(v: string) => editorStore.updateComponentProps(currentComponent!.id, { [field.key]: v })"
              />
              <!-- 下拉选择 -->
              <el-select
                v-else-if="field.type === 'select'"
                :model-value="String(componentProps[field.key] || '')"
                size="small"
                class="property-select"
                @update:model-value="(v: string) => editorStore.updateComponentProps(currentComponent!.id, { [field.key]: v })"
              >
                <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </div>
          </template>
        </template>

        <!-- 图层 -->
        <div class="property-section">图层</div>
        <div class="property-item">
          <label>层级 (zIndex)</label>
          <el-input
            :model-value="String(currentComponent.style.zIndex)"
            size="small"
            class="property-input"
            @update:model-value="(v: string) => editorStore.updateComponentStyle(currentComponent!.id, { zIndex: Number(v) || 1 })"
          />
        </div>

        <!-- 删除 -->
        <div class="property-divider"></div>
        <el-button type="danger" size="small" style="width: 100%" @click="editorStore.removeComponent(currentComponent.id)">
          删除组件
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/store/editor'
import { getComponentProtocol } from './components/registry'
import { Setting } from '@element-plus/icons-vue'

const editorStore = useEditorStore()

/** 当前页面 */
const currentPage = computed(() => editorStore.currentPage)

/** 当前选中组件 */
const currentComponent = computed(() => editorStore.currentComponent)

/** 选中组件的 protocol（schema 来源） */
const componentProtocol = computed(() => {
  if (!currentComponent.value) return null
  return getComponentProtocol(currentComponent.value.type) || null
})

/** 选中组件的 props 快捷访问 */
const componentProps = computed(() => {
  return (currentComponent.value?.props || {}) as Record<string, unknown>
})

/** Enter 键保存内容并取消输入状态 */
const handleEnterBlur = () => {
  ;(document.activeElement as HTMLElement)?.blur()
}
</script>

<style scoped>
.property-panel {
    width: 200px;
    height: 100%;
    background-color: #252526;
    border-left: 1px solid #3c3c3c;
    display: flex;
    flex-direction: column;
    color: #ccc;
}

.panel-header {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 500;
    border-bottom: 1px solid #3c3c3c;
    color: #fff;
}

.header-actions {
    cursor: pointer;
    color: #858585;
}

.header-actions:hover {
    color: #fff;
}

.panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
}

.property-section {
    font-size: 11px;
    color: #858585;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 12px 0 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #3c3c3c;
}

.property-section:first-child {
    margin-top: 0;
}

.property-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
}

.property-item label {
    font-size: 12px;
    color: #858585;
}

.property-select {
    width: 100%;
    background-color: #1e1e1e;
    border-color: #3c3c3c;
}

.property-input {
    width: 100%;
    background-color: #1e1e1e;
    border-color: #3c3c3c;
}

.color-picker-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
}

.color-input {
    flex: 1;
}

.property-divider {
    height: 1px;
    background-color: #3c3c3c;
    margin: 8px 0;
}

/* 颜色选择器：确保触发器可点击 */
:deep(.el-color-picker__trigger) {
    cursor: pointer;
    pointer-events: auto;
}
</style>

<!-- 全局：颜色选择器弹层 z-index 高于对话框/画布 -->
<style>
.el-color-dropdown {
    z-index: 3000 !important;
}
</style>
