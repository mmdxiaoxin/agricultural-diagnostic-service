export const DOWNLOAD_MESSAGE_PATTERNS = {
  FILE_DOWNLOAD: 'file.download',
  FILES_DOWNLOAD: 'files.download',
} as const;

export type DownloadMessagePattern =
  (typeof DOWNLOAD_MESSAGE_PATTERNS)[keyof typeof DOWNLOAD_MESSAGE_PATTERNS];
