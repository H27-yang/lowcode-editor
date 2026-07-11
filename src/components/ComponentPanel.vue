<template>
    <div class="component-panel">
        <text style="font-size:15px; margin-left:12px; color:#ccc">基础组件</text>
        <div class="component-item" 
            v-for="item in componentProtocols"
            :key="item.type"
            @click="editorStore.addComponent(item.type)"
            draggable="true"
            @dragstart="handleDragStart($event, item.type)"
            >
            <div class="item-icon" :class="`${item.type}-icon`"></div>
            <span>{{ item.label }}</span>
        </div>
        
        <div class="component-divider"></div> 
        <text style="font-size:15px; margin-left:12px; color:#ccc">图层管理</text>
        <div
            v-for="item in editorStore.currentPage?.components"
            :key="item.id"
            class="layer-item"
            :class="{ 'layer-active': item.id === editorStore.currentComponentId }"
            @click="editorStore.selectComponent(item.id)"
        >
            <span class="layer-icon" :class="`${item.type}-icon`"></span>
            <span class="layer-name">{{ item.name}}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { useEditorStore } from '@/store/editor'
    import { componentProtocols } from '@/components/components/registry'
    const editorStore = useEditorStore()

    const handleDragStart = (event: DragEvent, type: string) => {
        if (!event.dataTransfer) return
        event.dataTransfer.setData('componentType', type)
        event.dataTransfer.effectAllowed = 'copy'//运行操作类型
    }
</script>

<style scoped>
.component-panel {
    width: 160px;
    background-color: #252526;
    border-right: 1px solid #3c3c3c;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    padding: 4px 0;
}

.component-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    cursor: pointer;
    color: #ccc;
    font-size: 13px;
    transition: background-color 0.2s;
}

.component-item:hover {
    background-color: #3c3c3c;
}
.component-divider {                                                                                                                                                                                                                    
    height: 1px;                                                                                                                                                                                                                        
    background-color: #3c3c3c;                                                                                                                                                                                                          
    margin: 10px 0;                                                                                                                                                                                                                      
}  

.item-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #858585;
    font-size: 14px;
}

.text-icon::before {
    content: 'T';
}

.image-icon::before {
    content: '▧';
}

.button-icon::before {
    content: '▣';
}

.input-icon::before {
    content: '⬚';
}

.form-icon::before {
    content: '☰';
}


.layer-item {
    display: flex; 
    align-items: center; 
    gap: 8px;
    padding: 4px 12px; 
    cursor: pointer; 
    color: #ccc; 
    font-size: 12px;
  }
.layer-item:hover { background-color: #3c3c3c; }
.layer-active { 
    background-color: #094771;
    color: #fff; 
}
.layer-icon {
    width: 18px;
    height: 18px; 
    background: #3c3c3c;
    border-radius: 2px; 
    display: flex; align-items: center;
    justify-content: center; 
    font-size: 10px;
}
</style>
