<template>
  <div class="pixel-grid-container">
    <h3>拼豆图纸预览</h3>
    <div class="grid-wrapper">
      <div 
        v-if="pixelData && pixelData.length > 0"
        class="pixel-grid-wrapper"
        :style="{
          position: 'relative',
          margin: '0 auto',
          width: '100%',
          maxWidth: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }"
      >
        <div 
          class="pixel-grid"
          :style="{
            display: 'grid',
            gridTemplateColumns: `repeat(${pixelData[0].length}, minmax(8px, 1fr))`,
            gridTemplateRows: `repeat(${pixelData.length}, minmax(8px, 1fr))`,
            gap: '1px',
            backgroundColor: '#e0e0e0',
            padding: '10px',
            borderRadius: '8px',
            margin: '0 auto',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }"
        >
          <template v-for="(row, rowIndex) in pixelData" :key="rowIndex">
            <div
              v-for="(pixel, colIndex) in row"
              :key="`${rowIndex}-${colIndex}`"
              class="pixel-cell"
              :style="{
                backgroundColor: `rgb(${pixel.rgb[0]}, ${pixel.rgb[1]}, ${pixel.rgb[2]})`,
                aspectRatio: '1/1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: responsiveFontSize,
                fontWeight: 'bold',
                cursor: 'pointer',
                position: 'relative',
                border: '1px solid #ccc',
                userSelect: 'none',
                minWidth: '8px',
                minHeight: '8px'
              }"
              @mouseenter="handleCellMouseEnter(pixel, rowIndex, colIndex)"
              @mouseleave="handleCellMouseLeave"
            >
              {{ pixel.code }}
            </div>
          </template>
        </div>
        <!-- 预览水印 -->
        <div 
          class="watermark-overlay"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.5,
            overflow: 'hidden'
          }"
        >
          <div 
            class="watermark-text"
            :style="{
              position: 'absolute',
              top: '-20%',
              left: '-20%',
              width: '140%',
              height: '140%',
              transform: 'rotate(30deg)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '50px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'rgba(150, 150, 150, 0.5)',
              whiteSpace: 'nowrap'
            }"
          >
            <div v-for="i in 5" :key="i" class="watermark-row" :style="{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              gap: '100px'
            }">
              <span v-for="j in 5" :key="j">@Dro9an</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        请先上传图片并选择尺寸
      </div>
    </div>
    
    <!-- 颜色统计 -->
    <div v-if="colorStats.length > 0" class="color-stats">
      <h4>颜色统计</h4>
      <div class="stats-summary">
        <div class="total-beads">
          <span class="label">总共需要:</span>
          <span class="value">{{ totalBeads }} 颗豆子</span>
        </div>
      </div>
      <div class="legend-items">
        <div 
          v-for="color in colorStats" 
          :key="color.id"
          class="legend-item"
        >
          <div 
            class="legend-color" 
            :style="{
              backgroundColor: `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#000'
            }"
          >
            {{ color.code }}
          </div>
          <span class="legend-count">{{ color.count }} 颗</span>
        </div>
      </div>
    </div>
    
    <!-- 单元格信息提示 -->
    <el-tooltip
      v-model:visible="cellTooltipVisible"
      :content="cellTooltipContent"
      placement="top"
      :show-after="0"
      :hide-after="0"
    >
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, onMounted } from 'vue'

const props = defineProps({
  pixelData: {
    type: Array,
    default: () => []
  }
})

// 基础单元格大小
const baseCellSize = ref(25)

// 响应式字体大小
const responsiveFontSize = computed(() => {
  if (!props.pixelData || props.pixelData.length === 0) return '12px'
  
  const gridSize = props.pixelData.length
  const viewportWidth = window.innerWidth
  
  // 根据屏幕宽度和网格大小动态调整字体大小，确保在大尺寸时不溢出
  if (viewportWidth < 600) {
    // 移动端
    if (gridSize > 50) return '3px'
    if (gridSize > 40) return '4px'
    if (gridSize > 30) return '5px'
    if (gridSize > 20) return '7px'
    return '9px'
  } else if (viewportWidth < 1200) {
    // 平板端
    if (gridSize > 60) return '4px'
    if (gridSize > 50) return '5px'
    if (gridSize > 40) return '7px'
    if (gridSize > 30) return '9px'
    return '11px'
  } else {
    // 桌面端
    if (gridSize > 100) return '2px'
    if (gridSize > 80) return '3px'
    if (gridSize > 60) return '4px'
    if (gridSize > 50) return '5px'
    if (gridSize > 40) return '7px'
    if (gridSize > 30) return '9px'
    return '11px'
  }
})

// 鼠标悬停信息
const cellTooltipVisible = ref(false)
const cellTooltipContent = ref('')
const hoveredCell = ref(null)

// 颜色统计
const colorStats = ref([])
const totalBeads = ref(0)

// 监听像素数据变化，更新颜色统计
watch(
  () => props.pixelData,
  (newData) => {
    if (newData && newData.length > 0) {
      // 统计每个颜色的使用数量
      const colorCountMap = new Map()
      let total = 0
      
      newData.forEach(row => {
        row.forEach(pixel => {
          if (pixel && pixel.id) {
            const currentCount = colorCountMap.get(pixel.id) || 0
            colorCountMap.set(pixel.id, currentCount + 1)
            total++
          }
        })
      })
      
      // 转换为数组，并添加颜色信息
      const statsArray = []
      colorCountMap.forEach((count, id) => {
        // 找到对应的颜色信息
        const color = newData.flat().find(p => p.id === id)
        if (color) {
          statsArray.push({
            ...color,
            count
          })
        }
      })
      
      // 按颜色编码排序
      statsArray.sort((a, b) => a.code.localeCompare(b.code))
      
      colorStats.value = statsArray
      totalBeads.value = total
    } else {
      colorStats.value = []
      totalBeads.value = 0
    }
  },
  { deep: true, immediate: true }
)

// 处理单元格鼠标进入
const handleCellMouseEnter = (pixel, rowIndex, colIndex) => {
  if (pixel) {
    cellTooltipContent.value = `位置: (${colIndex + 1}, ${rowIndex + 1})\n色号: ${pixel.code}`
    cellTooltipVisible.value = true
    hoveredCell.value = { rowIndex, colIndex }
  }
}

// 处理单元格鼠标离开
const handleCellMouseLeave = () => {
  cellTooltipVisible.value = false
  hoveredCell.value = null
}
</script>

<style scoped>
.pixel-grid-container {
  margin: 20px 0;
}

.grid-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-width: 100%;
  max-height: 600px;
  padding-bottom: 20px;
  box-sizing: border-box;
}

.pixel-grid {
  white-space: nowrap;
}

.no-data {
  text-align: center;
  padding: 50px;
  color: #909399;
  font-size: 16px;
}

.color-stats {
  margin-top: 30px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stats-summary {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.total-beads {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-beads .label {
  font-weight: bold;
  color: #606266;
}

.total-beads .value {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-color {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  color: #000;
}

.legend-count {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}
</style>