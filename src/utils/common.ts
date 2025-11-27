export function highlight(text: string, keyword: string): string {
    if (!keyword.trim()) return text;
    const reg = new RegExp(`(${keyword})`, "gi");
    return text.replace(reg, '<span style="background:#ff0;color:#000;">$1</span>');
  }