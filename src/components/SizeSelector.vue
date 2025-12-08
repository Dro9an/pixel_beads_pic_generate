<template>
  <div class="size-selector-container">
    <h3>拼豆板尺寸是？👇</h3>
    <el-radio-group v-model="selectedSize" @change="handleSizeChange" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
      <el-radio-button label="10x10">10x10</el-radio-button>
      <el-radio-button label="20x20">20x20</el-radio-button>
      <el-radio-button label="30x30">30x30</el-radio-button>
      <el-radio-button label="40x40">40x40</el-radio-button>
      <el-radio-button label="52x52">52x52</el-radio-button>
      <el-radio-button label="custom">自定义</el-radio-button>
    </el-radio-group>
    <div style="display: flex;align-items: center;justify-content: center;gap:5px" v-if="selectedSize === 'custom'">
      <el-input-number
          v-model="customSize"
          :min="5"
          :max="1000"
          :step="5"
          @change="handleCustomSizeChange"
          style="width: 120px"
      />
      x {{customSize}}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'

const emit = defineEmits(['size-changed', 'update:selected-size'])

// 预设尺寸选项
const presets = {
  '10x10': { width: 10, height: 10 },
  '20x20': { width: 20, height: 20 },
  '30x30': { width: 30, height: 30 },
  '40x40': { width: 40, height: 40 },
  '52x52': { width: 52, height: 52 }
}

// 选中的尺寸
const selectedSize = ref('52x52')

// 自定义尺寸（1:1比例）
const customSize = ref(60)

// 当前尺寸
const currentWidth = computed(() => {
  if (selectedSize.value === 'custom') {
    return customSize.value
  }
  return presets[selectedSize.value].width
})

const currentHeight = computed(() => {
  if (selectedSize.value === 'custom') {
    return customSize.value
  }
  return presets[selectedSize.value].height
})

// 处理尺寸变化
const handleSizeChange = (value) => {
  emit('update:selected-size', value)
  emitSizeChange()
}

// 处理自定义尺寸变化
const handleCustomSizeChange = () => {
  emitSizeChange()
}

// 发射尺寸变化事件
const emitSizeChange = () => {
  emit('size-changed', {
    width: currentWidth.value,
    height: currentHeight.value
  })
}

// 初始触发一次
emitSizeChange()
emit('update:selected-size', selectedSize.value)
</script>

<style scoped>
.size-selector-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>