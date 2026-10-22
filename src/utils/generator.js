// 图纸生成器
import { getNearestBeadColor } from "./beadColors.js";

// 将图像缩放到指定尺寸并像素化
const pixelateImage = (imageUrl, width, height) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // 创建canvas元素
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 设置canvas尺寸为目标尺寸
      canvas.width = width;
      canvas.height = height;
      // 计算缩放比例和绘制位置
      let drawWidth, drawHeight;
      let offsetX = 0,
        offsetY = 0;

      if (img.width > img.height) {
        // 按宽度缩放
        drawWidth = width;
        drawHeight = (img.height / img.width) * width;
        // 垂直居中
        offsetY = (height - drawHeight) / 2;
      } else {
        // 按高度缩放
        drawHeight = height;
        drawWidth = (img.width / img.height) * height;
        // 水平居中
        offsetX = (width - drawWidth) / 2;
      }

      // 绘制图像
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

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
        canvas,
      });
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = imageUrl;
  });
};


/**
 * 生成拼豆图纸
 * @param {string} imageUrl 原始图片地址
 * @param {number} gridWidth 图纸宽度（格数）
 * @param {number} gridHeight 图纸高度（格数）
 * @param {string|number} colorCount 色数档位（如 96）
 * @returns {Promise<string>} 最终图纸的URL（PNG dataURL，预览与下载共用）
 */
export const generatePattern = async (
  imageUrl,
  gridWidth,
  gridHeight,
  colorCount,
) => {
  // 像素化处理图像
  const result = await pixelateImage(imageUrl, gridWidth, gridHeight);

  // 将像素颜色匹配到拼豆颜色
  const pixelData = result.pixels.map((row) => {
    return row.map((pixel) => {
      const nearestColor = getNearestBeadColor(pixel, colorCount);
      return {
        ...nearestColor,
        originalRgb: pixel,
      };
    });
  });

  // 豆子数量统计（按数量降序）
  const colorCountMap = new Map();
  pixelData.forEach((row) => {
    row.forEach((pixel) => {
      if (!pixel || !pixel.id) return;
      const existing = colorCountMap.get(pixel.id);
      if (existing) {
        existing.count++;
      } else {
        colorCountMap.set(pixel.id, { ...pixel, count: 1 });
      }
    });
  });
  const sortedColors = [...colorCountMap.values()].sort(
    (a, b) => b.count - a.count,
  );

  // 总豆子数 = 各颜色数量之和
  const totalBeads = sortedColors.reduce((sum, color) => sum + color.count, 0);

  // 创建导出用的canvas
  const canvas = document.createElement("canvas");
  const cellSize = 30; // 导出时的单元格大小
  const padding = 40; // 边框留白
  const width = pixelData[0].length * cellSize + padding * 2;
  const height = pixelData.length * cellSize + padding * 2;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // 绘制背景
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 绘制像素网格
  for (let y = 0; y < pixelData.length; y++) {
    for (let x = 0; x < pixelData[y].length; x++) {
      const pixel = pixelData[y][x];
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
      if (pixelData.length > 100) fontSize = 6;
      else if (pixelData.length > 80) fontSize = 8;
      else if (pixelData.length > 60) fontSize = 10;
      else if (pixelData.length > 50) fontSize = 12;

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

  // 统计信息（sortedColors 已按数量降序）
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

  sortedColors.forEach((color, index) => {
    // 计算当前项位置
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const x = statsStartX + col * itemWidth;
    const y = statsStartY + row * itemHeight;

    // 绘制颜色块
    ctx.fillStyle = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
    ctx.fillRect(x, y, 18, 18);

    // 绘制色号和数量
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.fillText(`${color.code}:${color.count}颗`, x + 25, y + 3);
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

  // 返回最终图纸URL
  return canvas.toDataURL("image/png");
};

