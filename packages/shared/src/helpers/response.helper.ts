export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  message: string;
}

export const formatResponse = <T = any>(
  code: number = 200,
  data: T | null = null,
  message: string = 'Success',
): ApiResponse<T> => {
  return { code, data, message };
};
