// エラーコードの定義
export const ErrorCode = {
  // 認証関連
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // バリデーション関連
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  
  // データベース関連
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  
  // その他
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// エラー情報の型定義
export type ErrorInfo = {
  code: ErrorCodeType;
  message: string;
  details?: unknown;
};

// 認証結果の型定義
export type AuthResult = {
  success: boolean;
  message?: string;
  error?: ErrorInfo;
};

// アクションのレスポンス型定義
export type ActionResponse<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  error?: ErrorInfo;
};

// エラーオブジェクトを作成するユーティリティ関数
export const createError = (
  code: ErrorCodeType,
  message: string,
  details?: unknown
): ErrorInfo => ({
  code,
  message,
  details,
});

// 成功レスポンスを作成するユーティリティ関数
export const createSuccessResponse = <T = void>(
  message: string,
  data?: T
): ActionResponse<T> => ({
  success: true,
  message,
  data,
});

// エラーレスポンスを作成するユーティリティ関数
export const createErrorResponse = <T = void>(
  message: string,
  error: ErrorInfo
): ActionResponse<T> => ({
  success: false,
  message,
  error,
});

// 認証エラーレスポンスを作成するユーティリティ関数
export const createAuthErrorResponse = (
  message: string,
  error: ErrorInfo
): AuthResult => ({
  success: false,
  message,
  error,
});

// 認証成功レスポンスを作成するユーティリティ関数
export const createAuthSuccessResponse = (message?: string): AuthResult => ({
  success: true,
  message,
});
  