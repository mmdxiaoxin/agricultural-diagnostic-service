export const FILE_MESSAGE_PATTERNS = {
  GET_FILE: 'file.get',
  GET_FILE_BY_ID: 'file.get.byId',
  UPDATE_FILE: 'file.update',
  DELETE_FILE: 'file.delete',
  GET_FILES: 'files.get',
  GET_FILES_BY_ID: 'files.get.byId',
  GET_FILES_LIST: 'files.get.list',
  UPDATE_FILES_ACCESS: 'files.update.access',
  DELETE_FILES: 'files.delete',
  FILES_STATISTIC_USAGE: 'files.statistic.usage',
} as const;

// TypeScript 类型推导，确保 `cmd` 的值受约束
export type FileMessagePattern =
  (typeof FILE_MESSAGE_PATTERNS)[keyof typeof FILE_MESSAGE_PATTERNS];
