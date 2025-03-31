export const FILE_MESSAGE_PATTERNS = {
  FILE_GET_BYID: 'file.get.byId',
  FILE_UPDATE: 'file.update',
  FILE_DELETE: 'file.delete',
  FILE_GET: 'file.get',
  FILE_GET_BYIDS: 'file.get.byIds',
  FILE_GET_LIST: 'file.get.list',
  FILE_UPDATE_ACCESS: 'file.update.access',
  FILE_DELETE_BATCH: 'file.delete.batch',
  FILE_DISK: 'file.disk',
} as const;

// TypeScript 类型推导，确保 `cmd` 的值受约束
export type FileMessagePattern =
  (typeof FILE_MESSAGE_PATTERNS)[keyof typeof FILE_MESSAGE_PATTERNS];
