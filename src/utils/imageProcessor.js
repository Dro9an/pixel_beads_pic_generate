// 图像处理工具函数

// 将图像缩放到指定尺寸并像素化
export const pixelateImage = (imageUrl, width, height) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 创建canvas元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置canvas尺寸为目标尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 先将图像绘制到canvas上，会自动缩放
      ctx.drawImage(img, 0, 0, width, height);
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // 提取像素颜色信息
      const pixels = [];
      for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          
          // 忽略透明像素，默认白色
          if (a < 128) {
            row.push([255, 255, 255]);
          } else {
            row.push([r, g, b]);
          }
        }
        pixels.push(row);
      }
      
      resolve({
        pixels,
        width,
        height,
        canvas
      });
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imageUrl;
  });
};