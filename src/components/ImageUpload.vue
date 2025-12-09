<template>
  <div class="image-upload-container">
    <el-upload
      class="upload-demo"
      action=""
      :http-request="handleUpload"
      :auto-upload="true"
      :before-upload="beforeUpload"
      list-type="picture-card"
      :show-file-list="false"
      accept="image/jpg,image/jpeg,image/png"
    >
      <template #default>
        <el-image
          v-if="imageUrl"
          :src="imageUrl"
          :fit="'contain'"
          :style="{ width: '100%', height: '100%' }"
        />
        <div
          style="display: flex; flex-direction: column; align-items: center"
          v-else
        >
          <el-icon size="24">
            <Plus />
          </el-icon>
          <div style="color: #909399; font-size: 12px; margin-top: 10px">
            点我上传图片~
          </div>
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const emit = defineEmits(["image-uploaded"]);

const fileList = ref([]);
const imageUrl = ref("");

const beforeUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error("只能上传图片噢！");
    return false;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error(
      "图片太大啦，只能上传10MB以下的图片噢！不会弄的话让我帮你处理一下",
    );
    return false;
  }
  return true;
};

const handleUpload = (options) => {
  const file = options.file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imageUrl.value = e.target.result;
    emit("image-uploaded", {
      result: e.target.result,
      fileName: file.name,
    });
  };
  reader.readAsDataURL(file);
  fileList.value = [file];
};
</script>

<style scoped>
.image-upload-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
</style>
