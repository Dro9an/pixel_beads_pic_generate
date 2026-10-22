<template>
  <el-dialog v-model="visible" title="图纸预览（图纸内含豆子统计，点击图片查看大图）" width="920px">
    <!-- 图纸预览（大图纸自动分片，逐张展示） -->
    <div class="preview-area">
      <div
        v-for="(url, index) in patternUrls"
        :key="index"
        class="preview-tile"
      >
        <p v-if="patternUrls.length > 1" class="tile-caption">
          第 {{ index + 1 }} / {{ patternUrls.length }} 张
        </p>
        <el-image
          class="preview-image"
          :src="url"
          :preview-src-list="patternUrls"
          :initial-index="index"
          alt="拼豆图纸预览"
        />
      </div>
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
  // 图纸分片URL列表（由 App.vue 调用 patternGenerator 生成，未超限时长度为 1）
  patternUrls: {
    type: Array,
    default: () => [],
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

// 下载图纸（多张分片时加间隔逐张触发，避免被浏览器拦截）
const downloadPattern = () => {
  const urls = props.patternUrls;
  if (!urls.length) return;

  const total = urls.length;
  const baseName = `拼豆图纸-${props.sizeType}-${props.colorCount}色-${props.fileName.split(".")[0]}`;

  urls.forEach((url, index) => {
    setTimeout(() => {
      const link = document.createElement("a");
      link.download =
        total > 1 ? `${baseName}-${index + 1}of${total}.png` : `${baseName}.png`;
      link.href = url;
      link.click();
    }, index * 300);
  });

  ElMessage.success("发射成功🚀！看看有没有开始下啦");
};
</script>

<style scoped>
.preview-tile {
  margin-bottom: 15px;
}

.preview-tile:last-child {
  margin-bottom: 0;
}

.tile-caption {
  margin: 0 0 8px;
  font-size: 14px;
  color: #606266;
  text-align: center;
}

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
