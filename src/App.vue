<template>
  <div class="app-container">
    <header class="app-header">
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
              @click="handleGenerate"
              :disabled="!imageUrl"
            >
              <el-icon style="margin-right: 5px" v-if="!generating"
                ><MagicStick
              /></el-icon>
              <span v-if="generating">生成中，请稍后...</span>
              <span v-else>开始生成</span>
            </el-button>
          </div>
        </div>
      </section>
    </main>

    <!-- 图纸预览&豆子数量统计弹窗（仅通过图纸URL展示预览与下载） -->
    <PreviewModal
      v-model="dialogVisible"
      :pattern-url="patternUrl"
      :size-type="selectedSizeType"
      :color-count="colorConfig.count"
      :file-name="fileName"
    />

    <footer>
      <p>
        © 2025-{{ new Date().getUTCFullYear() }} Dro9an. All rights reserved.
      </p>
      <p>Made with ❤️</p>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { MagicStick } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ImageUpload from "./components/ImageUpload.vue";
import SizeSelector from "./components/SizeSelector.vue";
import PreviewModal from "./components/PreviewModal.vue";
import { generatePattern } from "./utils/generator.js";

// 状态管理
const imageUrl = ref("");
const fileName = ref("");
const currentSize = ref({ width: 20, height: 20 });
const generating = ref(false);
const selectedSizeType = ref("52x52");
const patternUrl = ref("");
const dialogVisible = ref(false);

// 颜色配置
const colorConfig = reactive({
  count: "96",
});

// 处理图像上传
const handleImageUploaded = (data) => {
  imageUrl.value = data.result;
  fileName.value = data.fileName;
  ElMessage.success("报告长官，上传好了！整装待发✌️");
};

// 处理尺寸变化（仅记录配置，不触发耗时处理）
const handleSizeChanged = (size) => {
  currentSize.value = size;
};

// 处理尺寸类型变化（仅用于下载文件名）
const handleSizeTypeChanged = (sizeType) => {
  selectedSizeType.value = sizeType;
};

// 开始生成：调用图纸生成方法（像素化+颜色匹配+豆子统计+图纸绘制），完成后打开预览弹窗
const handleGenerate = async () => {
  if (!imageUrl.value) {
    ElMessage.warning("❌还没上传图片噢");
    return;
  }

  generating.value = true;

  try {
    // 生成最终图纸URL
    patternUrl.value = await generatePattern(
      imageUrl.value,
      currentSize.value.width,
      currentSize.value.height,
      colorConfig.count,
    );

    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error(
      "⚠️坏了出问题了，你把这个截图给我看看我马上就去修！\n" + error,
    );
    console.error(error);
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
.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
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
