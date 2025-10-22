var nodejieba = require("nodejieba");
// 初始化结巴分词
nodejieba.load();
/**
 * 处理代码字符串，对包含中文的行进行分词
 * @param code 输入的代码字符串
 * @returns 处理后的行数组
 */
export function processChineseLines(code: string): string {

  // 按行分割代码
  const lines = code.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    // 检查行是否包含中文
    if (containsChinese(line)) {
      // 对包含中文的行进行分词
      const processedLine = processChineseSegments(line);
      processedLines.push(processedLine);
    } else {
      // 不含中文的行直接保留
      processedLines.push(line);
    }
  }

  return processedLines.join('\n').trim();
}

/**
 * 处理字符串中的连续中文字符段
 * @param text 输入字符串
 * @returns 处理后的字符串
 */
function processChineseSegments(text: string): string {
  // 匹配连续的中文字符（包括中文标点）
  const chineseRegex = /[\u4e00-\u9fa5，。？！；："'《》【】、]+/g;
  
  // 使用结巴分词处理每个中文字符段
  return text.replace(chineseRegex, (match) => {
    // 对连续的中文字符进行分词
    const words = nodejieba.cut(match);
    // 用空格连接分词结果
    return ' ' + words.join(' ');
  });
}

/**
 * 检查字符串是否包含中文字符
 * @param text 输入字符串
 * @returns 是否包含中文
 */
function containsChinese(text: string): boolean {
  // 使用Unicode范围检测中文字符
  return /[\u4e00-\u9fa5]/.test(text);
}
