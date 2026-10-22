<template>
  <el-dialog v-model="visible" title="图纸预览（图纸内含豆子统计，点击图片查看大图）" width="920px">
    <!-- 图纸预览（统计信息已绘制在图纸内） -->
    <div class="preview-area">
      <el-image
        class="preview-image"
        :src="patternUrl"
        :preview-src-list="[patternUrl]"
        alt="拼豆图纸预览"
        v-if="patternUrl"
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">
          <el-icon style="margin-right: 5px"><Close /></el-icon>
          取消
        </el-button>
        <el-button type="success" @click="downloadPattern">
          <el-icon style="margin-right: 5px"><Download /></el-icon>
          下载图纸
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { Close, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 弹窗显示状态（v-model）
const visible = defineModel({ type: Boolean, default: false });

const props = defineProps({
  // 最终图纸URL（由 App.vue 调用 patternGenerator 生成）
  patternUrl: {
    type: String,
    default: "",
  },
  // 图纸尺寸类型（如 52x52，用于下载文件名）
  sizeType: {
    type: String,
    default: "",
  },
  // 色数档位（如 96，用于下载文件名）
  colorCount: {
    type: String,
    default: "",
  },
  // 原始上传文件名（用于下载文件名）
  fileName: {
    type: String,
    default: "",
  },
});

// 下载图纸（预览图即图纸，点击下载时按当前配置拼接文件名）
const downloadPattern = () => {
  if (!props.patternUrl) return;

  const link = document.createElement("a");
  link.download = `拼豆图纸-${props.sizeType}-${props.colorCount}色-${props.fileName.split(".")[0]}.png`;
  link.href = props.patternUrl;
  link.click();

  ElMessage.success("发射成功🚀！看看有没有开始下啦");
};
</script>

<style scoped>
.preview-image {
  width: 100%;
  height: auto;
  display: block;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.preview-area {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
</style>
