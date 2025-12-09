<template>
  <div class="pixel-grid-container">
    <!-- 颜色统计 -->
    <div class="color-stats">
      <h4 style="margin-bottom: 10px">豆子数量统计</h4>
      <div class="stats-summary">
        <div class="total-beads" v-if="colorStats.length > 0">
          <span class="label">总共需要:</span>
          <span class="value">{{ totalBeads }} 颗豆子</span>
        </div>
        <div class="total-beads" style="padding: 10px" v-else>
          <span class="label">上传好图片就可以查看豆子统计啦</span>
        </div>
      </div>
      <div class="legend-items">
        <div v-for="color in colorStats" :key="color.id" class="legend-item">
          <div
            class="legend-color"
            :style="{
              backgroundColor: `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#000',
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
import { ref, watch, defineProps } from "vue";

const props = defineProps({
  pixelData: {
    type: Array,
    default: () => [],
  },
});

// 鼠标悬停信息
const cellTooltipVisible = ref(false);
const cellTooltipContent = ref("");

// 颜色统计
const colorStats = ref([]);
const totalBeads = ref(0);

// 监听像素数据变化，更新颜色统计
watch(
  () => props.pixelData,
  (newData) => {
    if (newData && newData.length > 0) {
      // 统计每个颜色的使用数量
      const colorCountMap = new Map();
      let total = 0;

      newData.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel && pixel.id) {
            const currentCount = colorCountMap.get(pixel.id) || 0;
            colorCountMap.set(pixel.id, currentCount + 1);
            total++;
          }
        });
      });

      // 转换为数组，并添加颜色信息
      const statsArray = [];
      colorCountMap.forEach((count, id) => {
        // 找到对应的颜色信息
        const color = newData.flat().find((p) => p.id === id);
        if (color) {
          statsArray.push({
            ...color,
            count,
          });
        }
      });

      // 按豆子数量排序
      statsArray.sort((a, b) => b.count - a.count);

      colorStats.value = statsArray;
      totalBeads.value = total;
    } else {
      colorStats.value = [];
      totalBeads.value = 0;
    }
  },
  { deep: true, immediate: true },
);
</script>

<style scoped>
.color-stats {
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
