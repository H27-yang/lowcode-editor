import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Command } from '@/type/index'

export const useHistoryStore = defineStore('history', () => {
    const undoStack = ref<Command[]>([])//撤销栈
    const redoStack = ref<Command[]>([])//重做栈

    const maxHistorySize = 100//每个栈最多存放100条

    const undo = () => {
        const command = undoStack.value.pop()
        if(!command) return 

        command.undo()//执行命令的撤销逻辑
        redoStack.value.push(command)
    }
    //重做本质上是撤销命令的撤销，让被撤销命令重新生效
    const redo = () => {
        const command = redoStack.value.pop()
        if(!command) return

        command.execute()
        undoStack.value.push(command)
    }

    const clearHistory = () => {
        undoStack.value = []
        redoStack.value = []
      }
    
    const canUndo = computed(() => undoStack.value.length > 0)
    const canRedo = computed(() => redoStack.value.length > 0)

    const executeCommand = (command: Command) => {
        command.execute()
        undoStack.value.push(command)

        if(undoStack.value.length > maxHistorySize) undoStack.value.shift()

        redoStack.value = []
    }
    return { undoStack, redoStack, redo, undo, clearHistory, executeCommand, canUndo, canRedo }
})