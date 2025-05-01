export const DIAGNOSIS_MESSAGE_PATTERNS = {
  CREATE: 'diagnosis.create',
  START: 'diagnosis.start',
  START_ASYNC: 'diagnosis.start.async',
  STATUS: 'diagnosis.status',
  SUPPORT: 'diagnosis.support',
  SUPPORT_CREATE: 'diagnosis.support.create',
  SUPPORT_LIST: 'diagnosis.support.list',
  SUPPORT_GET: 'diagnosis.support.get',
  SUPPORT_UPDATE: 'diagnosis.support.update',
  SUPPORT_DELETE: 'diagnosis.support.delete',
  STATISTICS: 'diagnosis.statistics',
  HISTORY: 'diagnosis.history',
  HISTORY_LIST: 'diagnosis.history.list',
  HISTORY_DELETE: 'diagnosis.history.delete',
  HISTORIES_DELETE: 'diagnosis.histories.delete',
  LOG: 'diagnosis.log',
  LOG_LIST: 'diagnosis.log.list',
  FEEDBACK_LIST: 'diagnosis.feedback.list',
  FEEDBACK_LIST_ALL: 'diagnosis.feedback.list.all',
  FEEDBACK_CREATE: 'diagnosis.feedback.create',
  FEEDBACK_UPDATE: 'diagnosis.feedback.update',
  FEEDBACK_DELETE: 'diagnosis.feedback.delete',
  FEEDBACK_DETAIL: 'diagnosis.feedback.detail',
  FEEDBACK_DELETE_BATCH: 'diagnosis.feedback.delete.batch',
} as const;

export type DiagnosisMessagePattern =
  (typeof DIAGNOSIS_MESSAGE_PATTERNS)[keyof typeof DIAGNOSIS_MESSAGE_PATTERNS];
