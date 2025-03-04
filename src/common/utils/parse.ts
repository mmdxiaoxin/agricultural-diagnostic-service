export const parseSize = (size: string): number => {
  const regex = /^(\d+)(kb|mb|gb|tb)$/i;
  const match = size.match(regex);

  if (!match) {
    throw new Error(`无效的大小格式: ${size}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'kb':
      return value * 1024; // KB -> 字节
    case 'mb':
      return value * 1024 * 1024; // MB -> 字节
    case 'gb':
      return value * 1024 * 1024 * 1024; // GB -> 字节
    case 'tb':
      return value * 1024 * 1024 * 1024 * 1024; // TB -> 字节
    default:
      throw new Error(`不支持的单位: ${unit}`);
  }
};
