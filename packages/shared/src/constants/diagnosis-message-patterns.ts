export const DIAGNOSIS_MESSAGE_PATTERNS = {
  CREATE: 'diagnosis.create',
  START: 'diagnosis.start',
  START_ASYNC: 'diagnosis.start.async',
  STATUS: 'diagnosis.status',
  SUPPORT: 'diagnosis.support',
  STATISTICS: 'diagnosis.statistics',
  HISTORY: 'diagnosis.history',
  HISTORY_LIST: 'diagnosis.history.list',
  HISTORY_DELETE: 'diagnosis.history.delete',
  HISTORIES_DELETE: 'diagnosis.histories.delete',
  LOG: 'diagnosis.log',
  LOG_LIST: 'diagnosis.log.list',
  FEEDBACK_LIST: 'diagnosis.feedback.list',
  FEEDBACK_CREATE: 'diagnosis.feedback.create',
  FEEDBACK_UPDATE: 'diagnosis.feedback.update',
  FEEDBACK_DELETE: 'diagnosis.feedback.delete',
  FEEDBACK_DETAIL: 'diagnosis.feedback.detail',
} as const;

export type DiagnosisMessagePattern =
  (typeof DIAGNOSIS_MESSAGE_PATTERNS)[keyof typeof DIAGNOSIS_MESSAGE_PATTERNS];
