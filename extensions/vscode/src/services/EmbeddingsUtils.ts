/**
 * 判断文件是否为文本文件（UTF-8 编码，支持多语言），包含文件名后缀检查
 * @param fileName 文件名（包含文件名和后缀）
 * @returns 是否为文本文件
 */
function isTextFile(fileName: string): boolean {
  // 前置检查文件名后缀
  const nonTextExtensions = [
    '.jpg', '.jpeg', '.png', '.exe', '.bin', '.pdf', '.gif', '.bmp', '.zip', '.rar',
    '.mp3', '.mp4', '.avi', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.ico', '.svg'
  ];
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  if (!ext || ext === fileName || nonTextExtensions.includes(ext)) {
    return false; // 无后缀或非文本后缀，直接返回 false
  }
  return true;
}

/**
 * 判断字符串是否为文本内容（UTF-8 编码，支持多语言）
 * @param input UTF-8 编码的字符串
 * @param sampleSize 检查的最大字节数，默认 4096
 * @returns 是否为文本内容
 */
function isTextString(input: string, sampleSize: number = 4096): boolean {
  // 空字符串视为非文本（可根据需求调整）
  if (!input) {
    return false;
  }

  // 将字符串转换为 UTF-8 编码的字节
  const data = Buffer.from(input, 'utf8');
  const bytesRead = Math.min(data.length, sampleSize); // 限制检查字节数
  const slicedData = data.slice(0, bytesRead);

  // 检查 NUL 字节（0x00）比例
  const nulCount = slicedData.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
  const nulRatio = nulCount / bytesRead;

  // 如果 NUL 字节占比 > 1%，视为非文本
  if (nulRatio > 0.01) {
    return false;
  }

  // 检查 UTF-8 兼容性：统计有效 UTF-8 字节（包括 ASCII 和多字节序列）
  let validUtf8Count = 0;
  for (let i = 0; i < bytesRead; ) {
    const byte = slicedData[i];
    if (byte <= 0x7F) {
      // 单字节 ASCII (0x00-0x7F)
      validUtf8Count++;
      i++;
    } else if (byte >= 0xC2 && byte <= 0xDF) {
      // 2 字节 UTF-8 序列
      if (i + 1 < bytesRead && slicedData[i + 1] >= 0x80 && slicedData[i + 1] <= 0xBF) {
        validUtf8Count += 2;
        i += 2;
      } else {
        return false; // 无效 UTF-8 序列
      }
    } else if (byte >= 0xE0 && byte <= 0xEF) {
      // 3 字节 UTF-8 序列（包括中文）
      if (
        i + 2 < bytesRead &&
        slicedData[i + 1] >= 0x80 && slicedData[i + 1] <= 0xBF &&
        slicedData[i + 2] >= 0x80 && slicedData[i + 2] <= 0xBF
      ) {
        validUtf8Count += 3;
        i += 3;
      } else {
        return false; // 无效 UTF-8 序列
      }
    } else if (byte >= 0xF0 && byte <= 0xF4) {
      // 4 字节 UTF-8 序列
      if (
        i + 3 < bytesRead &&
        slicedData[i + 1] >= 0x80 && slicedData[i + 1] <= 0xBF &&
        slicedData[i + 2] >= 0x80 && slicedData[i + 2] <= 0xBF &&
        slicedData[i + 3] >= 0x80 && slicedData[i + 3] <= 0xBF
      ) {
        validUtf8Count += 4;
        i += 4;
      } else {
        return false; // 无效 UTF-8 序列
      }
    } else {
      // 无效 UTF-8 字节
      return false;
    }
  }

  // 如果有效 UTF-8 字节占比 >= 90%，视为文本
  return validUtf8Count / bytesRead >= 0.9;
}

// 示例使用
function testEmbeddingsUtils() {

    console.log(`vvv testEmbeddingsUtils`);
    console.log(`vvv isTextFile('embeddingsv2.json'): ${isTextFile('embeddingsv2.json')}`);
    console.log(`vvv isTextFile('embeddingsv2.txt'): ${isTextFile('embeddingsv2.txt')}`);
    console.log(`vvv isTextFile('embeddingsv2.md'): ${isTextFile('embeddingsv2.md')}`);
    console.log(`vvv isTextFile('embeddingsv2.exe'): ${isTextFile('embeddingsv2.exe')}`);
    console.log(`vvv isTextFile('embeddingsv2.pdf'): ${isTextFile('embeddingsv2.pdf')}`);

    const testCases = [
        "这是一个中文文本，包含一些 English 和 123 数字。", // 中英文混合
        "こんにちは、世界！", // 日文
        "مرحبا بالعالم", // 阿拉伯文
        "\x00\x00\xFF\x00binary", // 包含 NUL 字节的二进制数据
        "Simple ASCII text", // 纯 ASCII
        "", // 空字符串
    ];

    for (const input of testCases) {
        const isText = isTextString(input);
        console.log(`vvv testIsTextString 输入: ${input.slice(0, 20)}..., 是否文本: ${isText}`);
    }
}

export { isTextFile, isTextString, testEmbeddingsUtils };
