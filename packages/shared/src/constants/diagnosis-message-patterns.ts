export const DIAGNOSIS_MESSAGE_PATTERNS = {
  CREATE: 'diagnosis.create',
  START: 'diagnosis.start',
  STATUS: 'diagnosis.status',
  SUPPORT: 'diagnosis.support',
  HISTORY: 'diagnosis.history',
  HISTORY_LIST: 'diagnosis.history.list',
  HISTORY_DELETE: 'diagnosis.history.delete',
  HISTORIES_DELETE: 'diagnosis.histories.delete',
} as const;

export type DiagnosisMessagePattern =
  (typeof DIAGNOSIS_MESSAGE_PATTERNS)[keyof typeof DIAGNOSIS_MESSAGE_PATTERNS];
