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
 * @returns {Promise<string[]>} 图纸分片的URL数组（PNG dataURL，预览与下载共用，未超限时长度为 1）
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

  // 导出渲染：单元格固定 60px、色号固定 27px，不随格数缩小，
  // 保证放大查看时色号始终清晰可见且永不省略。
  // 大格数时单张 canvas 会超出浏览器安全上限（Safari/iOS：单边 4096px、
  // 总面积约 1677 万像素，超限时 toDataURL 输出损坏图片），
  // 因此自动按行/列均衡切成多张分片，最后一张附带豆子统计。
  const CELL_SIZE = 60; // 每个单元格渲染尺寸（px）
  const PADDING = 40; // 边框留白
  const MAX_DIM = 4096; // 单张画布单边安全上限
  const fontSize = 27; // 色号字号（CELL_SIZE * 0.45）

  // 每张分片单边可容纳的最大格数
  const maxCellsPerTile = Math.floor((MAX_DIM - PADDING * 2) / CELL_SIZE);

  // 列方向均衡分片
  const colChunks = Math.ceil(pixelData[0].length / maxCellsPerTile);
  const colsPerTile = Math.ceil(pixelData[0].length / colChunks);

  // 统计区只绘制在右下角分片，其高度按该分片宽度计算，并折算为虚拟行参与行方向均分
  const lastColChunkCols = pixelData[0].length - (colChunks - 1) * colsPerTile;
  const statsTileWidth = lastColChunkCols * CELL_SIZE + PADDING * 2;
  const itemWidth = 110; // 每个统计项宽度
  const itemHeight = 25; // 每个统计项高度
  const itemsPerRow =
    Math.floor((statsTileWidth - PADDING * 2) / itemWidth) || 1;
  const statsHeight =
    10 + Math.ceil(sortedColors.length / itemsPerRow) * itemHeight;
  const statsRows = Math.ceil(statsHeight / CELL_SIZE); // 统计区折算占用的格数

  // 行方向均衡分片
  const totalVirtualRows = pixelData.length + statsRows;
  const rowChunks =
    totalVirtualRows <= maxCellsPerTile
      ? 1
      : Math.ceil(totalVirtualRows / maxCellsPerTile);
  const rowsPerTile = Math.ceil(totalVirtualRows / rowChunks);

  // 逐分片绘制
  const tileUrls = [];
  for (let rowChunk = 0; rowChunk < rowChunks; rowChunk++) {
    for (let colChunk = 0; colChunk < colChunks; colChunk++) {
      const isLast =
        rowChunk === rowChunks - 1 && colChunk === colChunks - 1;

      const startRow = rowChunk * rowsPerTile;
      // 最后一张分片需扣除统计区占用的虚拟行
      const endRow = Math.min(
        startRow + (rowChunk === rowChunks - 1 ? rowsPerTile - statsRows : rowsPerTile),
        pixelData.length,
      );
      const gridRows = Math.max(0, endRow - startRow);

      const startCol = colChunk * colsPerTile;
      const endCol = Math.min(startCol + colsPerTile, pixelData[0].length);
      const gridCols = endCol - startCol;

      const width = gridCols * CELL_SIZE + PADDING * 2;
      const height =
        gridRows * CELL_SIZE + PADDING * 2 + (isLast ? statsHeight : 0);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // 绘制背景
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 绘制像素网格与色号
      for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
          const pixel = pixelData[y][x];
          const px = (x - startCol) * CELL_SIZE + PADDING;
          const py = (y - startRow) * CELL_SIZE + PADDING;

          // 绘制单元格
          ctx.fillStyle = `rgb(${pixel.rgb[0]}, ${pixel.rgb[1]}, ${pixel.rgb[2]})`;
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

          // 绘制边框
          ctx.strokeStyle = "#cccccc";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

          // 绘制色号(深色背景文字为白色，浅色背景文字为黑色)
          ctx.fillStyle =
            pixel.rgb.reduce((acc, val) => acc + val, 0) > 300
              ? "#000000"
              : "#ffffff";
          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pixel.code, px + CELL_SIZE / 2, py + CELL_SIZE / 2);
        }
      }

      // 右下角分片绘制统计信息
      if (isLast) {
        const statsStartX = PADDING;
        const statsStartY = gridRows * CELL_SIZE + PADDING * 2;

        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // 绘制总豆子数
        ctx.font = "bold 16px Arial";
        ctx.fillText(`总豆子数: ${totalBeads}颗`, PADDING, statsStartY - 25);

        // 绘制颜色统计列表
        ctx.font = "14px Arial";
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
          ctx.fillText(`${color.code}:${color.count}颗`, x + 25, y + 3);
        });
      }

      // 添加斜向重复水印
      ctx.save();
      ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const watermarkText = "@Dro9an";
      const angle = Math.PI / 6; // 30度
      const textWidth = ctx.measureText(watermarkText).width;
      const spacing = Math.max(textWidth, 100) * 1.5;

      // 平移原点到分片中心，方便旋转
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);

      const wmCols = Math.ceil(width / spacing) + 1;
      const wmRows = Math.ceil(height / spacing) + 1;
      for (let i = -wmRows; i < wmRows; i++) {
        for (let j = -wmCols; j < wmCols; j++) {
          ctx.fillText(watermarkText, j * spacing, i * spacing);
        }
      }
      ctx.restore();

      tileUrls.push(canvas.toDataURL("image/png"));
    }
  }

  // 返回所有分片的URL（未超限时数组长度为 1）
  return tileUrls;
};

