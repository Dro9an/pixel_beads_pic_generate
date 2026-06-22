<template>
  <div class="app-container">
    <header>
      <h1>MARD拼豆图纸生成器</h1>
      <p>1.上传图片 2.选择尺寸与色系 3.生成and enjoy!</p>
    </header>

    <main>
      <!-- 图像上传 -->
      <section class="upload-section">
        <ImageUpload @image-uploaded="handleImageUploaded" />
      </section>

      <!-- 尺寸选择和控制 -->
      <section class="control-section">
        <div class="controls">
          <SizeSelector
            @size-changed="handleSizeChanged"
            @update:selected-size="handleSizeTypeChanged"
          />

          <div
            style="
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
            "
          >
            <h3>豆子是MARD多少色呢？👇</h3>
            <el-radio-group
              v-model="colorConfig.count"
              style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
              "
            >
              <el-radio-button label="24">24色</el-radio-button>
              <el-radio-button label="48">48色</el-radio-button>
              <el-radio-button label="72">72色</el-radio-button>
              <el-radio-button label="96">96色</el-radio-button>
              <el-radio-button label="120">120色</el-radio-button>
              <el-radio-button label="144">144色</el-radio-button>
              <el-radio-button label="221">221色</el-radio-button>
              <el-radio-button label="264">264色</el-radio-button>
              <el-radio-button label="291">291（完整）色</el-radio-button>
            </el-radio-group>
          </div>

          <div class="generate-button">
            <el-button
              type="success"
              size="large"
              :loading="generating"
              @click="generateAndDownloadPixelArt"
              :disabled="!imageUrl"
            >
              <el-icon style="margin-right: 5px"><Download /></el-icon>
              生成并下载图纸
            </el-button>
          </div>

          <PixelGrid :pixel-data="pixelData" />
        </div>
      </section>
    </main>

    <footer>
      <p>© 2025-{{ new Date().getUTCFullYear() }} Dro9an. All rights reserved.</p>
      <p>Made with ❤️</p>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref, unref } from "vue";
import { Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ImageUpload from "./components/ImageUpload.vue";
import SizeSelector from "./components/SizeSelector.vue";
import PixelGrid from "./components/PixelGrid.vue";
import { pixelateImage } from "./utils/imageProcessor.js";
import { beadColors, getNearestBeadColor } from "./assets/beadColors.js";

// 状态管理
const imageUrl = ref("");
const fileName = ref("");
const currentSize = ref({ width: 20, height: 20 });
const generating = ref(false);
const selectedSizeType = ref("52x52");
const pixelData = ref([]);

// 颜色配置
const colorConfig = reactive({
  count: "96",
});

// 处理图像上传
const handleImageUploaded = async (data) => {
  generating.value = true;
  imageUrl.value = data.result;
  fileName.value = data.fileName;
  // 像素化处理图像
  const result = await pixelateImage(
    imageUrl.value,
    currentSize.value.width,
    currentSize.value.height,
  );

  // 将像素颜色匹配到拼豆颜色
  pixelData.value = result.pixels.map((row) => {
    return row.map((pixel) => {
      // 传递当前选择的颜色数量
      const nearestColor = getNearestBeadColor(pixel, colorConfig.count);
      return {
        ...nearestColor,
        originalRgb: pixel,
      };
    });
  });
  generating.value = false;
  ElMessage.success("报告长官，上传好了！整装待发✌️");
};

// 处理尺寸变化
const handleSizeChanged = (size) => {
  currentSize.value = size;
};

// 处理尺寸类型变化
const handleSizeTypeChanged = (sizeType) => {
  selectedSizeType.value = sizeType;
};

// 生成并下载拼豆图纸
const generateAndDownloadPixelArt = async () => {
  if (!imageUrl.value) {
    ElMessage.warning("还没上传图片噢");
    return;
  }

  generating.value = true;

  try {
    const matchedPixels = unref(pixelData);
    // 创建导出用的canvas
    const canvas = document.createElement("canvas");
    const cellSize = 30; // 导出时的单元格大小
    const padding = 40; // 边框留白
    const width = matchedPixels[0].length * cellSize + padding * 2;
    const height = matchedPixels.length * cellSize + padding * 2;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    // 绘制背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 绘制像素网格
    for (let y = 0; y < matchedPixels.length; y++) {
      for (let x = 0; x < matchedPixels[y].length; x++) {
        const pixel = matchedPixels[y][x];
        const px = x * cellSize + padding;
        const py = y * cellSize + padding;

        // 绘制单元格
        ctx.fillStyle = `rgb(${pixel.rgb[0]}, ${pixel.rgb[1]}, ${pixel.rgb[2]})`;
        ctx.fillRect(px, py, cellSize, cellSize);

        // 绘制边框
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);

        // 根据网格大小动态调整字体大小
        let fontSize = 14;
        if (matchedPixels.length > 100) fontSize = 6;
        else if (matchedPixels.length > 80) fontSize = 8;
        else if (matchedPixels.length > 60) fontSize = 10;
        else if (matchedPixels.length > 50) fontSize = 12;

        // 绘制色号(深色背景文字为白色，浅色背景文字为黑色)
        ctx.fillStyle =
          pixel.rgb.reduce((acc, val) => acc + val, 0) > 300
            ? "#000000"
            : "#ffffff";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pixel.code, px + cellSize / 2, py + cellSize / 2);
      }
    }

    // 计算豆子统计信息
    const totalBeads = matchedPixels.length * matchedPixels[0].length;
    const colorStats = matchedPixels.flat().reduce((acc, pixel) => {
      acc[pixel.code] = (acc[pixel.code] || 0) + 1;
      return acc;
    }, {});

    // 计算统计信息所需高度
    const sortedColors = Object.entries(colorStats).sort((a, b) => b[1] - a[1]);
    const itemWidth = 110; // 每个统计项宽度
    const itemHeight = 25; // 每个统计项高度
    const itemsPerRow = Math.floor((canvas.width - padding * 2) / itemWidth);
    const rows = Math.ceil(sortedColors.length / itemsPerRow);
    const statsHeight = 10 + rows * itemHeight; // 总数量、颜色列表的总高度

    // 创建临时canvas保存原始内容
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);

    // 调整原canvas高度以容纳统计信息
    canvas.height += statsHeight;

    // 重新绘制原始内容
    ctx.drawImage(tempCanvas, 0, 0);

    // 绘制统计信息背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, tempCanvas.height, canvas.width, statsHeight);

    // 绘制统计信息
    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // 绘制总豆子数
    ctx.font = "bold 16px Arial";
    ctx.fillText(`总豆子数: ${totalBeads}颗`, padding, tempCanvas.height - 25);

    // 绘制颜色统计列表
    const statsStartX = padding;
    const statsStartY = tempCanvas.height;

    ctx.font = "14px Arial";
    ctx.fillStyle = "#000000";

    sortedColors.forEach(([code, count], index) => {
      // 计算当前项位置
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const x = statsStartX + col * itemWidth;
      const y = statsStartY + row * itemHeight;

      // 查找颜色信息
      const colorInfo = beadColors.find((color) => color.code === code);
      if (colorInfo) {
        // 绘制颜色块
        ctx.fillStyle = `rgb(${colorInfo.rgb[0]}, ${colorInfo.rgb[1]}, ${colorInfo.rgb[2]})`;
        ctx.fillRect(x, y, 18, 18);

        // 绘制色号和数量
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.fillText(`${code}:${count}颗`, x + 25, y + 3);
      }
    });

    // 添加斜向重复水印
    ctx.save();
    ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 水印文本
    const watermarkText = "@Dro9an";

    // 计算水印旋转角度和间隔
    const angle = Math.PI / 6; // 30度
    const textWidth = ctx.measureText(watermarkText).width;
    const spacing = Math.max(textWidth, 100) * 1.5;

    // 平移原点到中心，方便旋转
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);

    // 计算需要绘制的水印行数和列数
    const wmCols = Math.ceil(width / spacing) + 1;
    const wmRows = Math.ceil(height / spacing) + 1;

    // 绘制重复水印
    for (let i = -wmRows; i < wmRows; i++) {
      for (let j = -wmCols; j < wmCols; j++) {
        const x = j * spacing;
        const y = i * spacing;
        ctx.fillText(watermarkText, x, y);
      }
    }

    // 恢复旋转状态
    ctx.restore();

    // 生成图片并下载（文件名：拼豆图纸-色数.png-尺寸-原文件名）
    const link = document.createElement("a");
    link.download = `拼豆图纸-${selectedSizeType.value}-${colorConfig.count}色-${fileName.value.split(".")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    ElMessage.success("发射成功🚀！看看有没有开始下啦");
  } catch (error) {
    ElMessage.error(
      "坏了出问题了，你把这个截图给我看看我马上就去修！\n" + error,
    );
  } finally {
    generating.value = false;
  }
};
</script>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f0f2f5;
  color: #333;
}

/* 应用容器 */
.app-container {
  width: 100vw;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* 头部样式 */
header {
  text-align: center;
  margin-bottom: 30px;
}

header h1 {
  color: #409eff;
  font-size: 2.5em;
  margin-bottom: 10px;
}

/* 主要内容区域 */
main {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 上传区域 */
.upload-section {
  margin-bottom: 30px;
  text-align: center;
}

/* 控制区域 */
.control-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 生成按钮 */
.generate-button {
  text-align: center;
  margin-top: 20px;
}

/* 底部样式 */
footer {
  text-align: center;
  margin-top: 30px;
  color: #909399;
  font-size: 0.9em;
}
</style>
