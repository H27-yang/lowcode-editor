<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEditorStore } from '@/store/editor'

const editorStore = useEditorStore()
const showRecoveryDialog = ref(false)
const savedPageTitle = ref('')

/** 启动时检测是否有上次未完成的编辑 */
onMounted(() => {
  const saved = localStorage.getItem(editorStore.localStorageKey)
  if (!saved) {
    editorStore.createNewPage()
    return
  }

  try {
    const page = JSON.parse(saved)
    savedPageTitle.value = page?.meta?.title || '未命名页面'
    showRecoveryDialog.value = true
  } catch {
    localStorage.removeItem(editorStore.localStorageKey)
    editorStore.createNewPage()
  }
})


const handleRestore = () => {
  editorStore.loadPersistPage()
  showRecoveryDialog.value = false
}

const handleNewPage = () => {
  editorStore.createNewPage()
  showRecoveryDialog.value = false
}
</script>

<template>
  <router-view></router-view>
  <el-dialog v-model="showRecoveryDialog" title="恢复未完成的页面" width="400px">
  <p>检测到您上次编辑的页面：<strong>{{ savedPageTitle }}</strong></p>
  <p>是否要继续编辑？</p>
  <template #footer>
    <el-button @click="handleNewPage">新建空白页面</el-button>
    <el-button type="primary" @click="handleRestore">恢复页面</el-button>
  </template>
</el-dialog>
</template>

<style>
</style>