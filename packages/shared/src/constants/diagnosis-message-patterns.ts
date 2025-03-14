export const DIAGNOSIS_MESSAGE_PATTERNS = {
  CREATE: 'diagnosis.create',
  START: 'diagnosis.start',
  STATUS: 'diagnosis.status',
  HISTORY: 'diagnosis.history',
  SUPPORT: 'diagnosis.support',
  HISTORY_LIST: 'diagnosis.history.list',
} as const;

export type DiagnosisMessagePattern =
  (typeof DIAGNOSIS_MESSAGE_PATTERNS)[keyof typeof DIAGNOSIS_MESSAGE_PATTERNS];
