export function highlight(text: string, keyword: string): string {
  if (!keyword.trim()) return text;
  const reg = new RegExp(`(${keyword})`, "gi");
  return text.replace(reg, '<span style="background:#ff0;color:#000;">$1</span>');
}

/**
 * 去除HTML标签，返回纯文本
 * @param html HTML字符串
 * @returns 去除HTML标签后的纯文本
 */
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return '';
  // 创建一个临时DOM元素来解析HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // 获取纯文本内容
  return tmp.textContent || tmp.innerText || '';
}

/**
 * 去除HTML标签（使用正则表达式方式，适用于非浏览器环境）
 * @param html HTML字符串
 * @returns 去除HTML标签后的纯文本
 */
export function stripHtmlTagsRegex(html: string | null | undefined): string {
  if (!html) return '';
  // 使用正则表达式去除HTML标签
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除script标签及其内容
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除style标签及其内容
    .replace(/<[^>]+>/g, '') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ') // 替换&nbsp;为空格
    .replace(/&lt;/g, '<') // 替换HTML实体
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}