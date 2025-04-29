import { Disease } from '@app/database/entities';

export type RuleType = 'exact' | 'fuzzy' | 'regex' | 'contains';

export interface DiagnosisRuleConfig {
  type: RuleType;
  field: string; // 匹配的字段，如 class_name
  value: string; // 匹配的值
  weight?: number; // 权重，用于评分
}

export interface MatchResult {
  disease: Disease;
  score: number;
  matchedRules: DiagnosisRuleConfig[];
}
