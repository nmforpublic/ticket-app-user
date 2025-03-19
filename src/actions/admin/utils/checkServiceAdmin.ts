'use server';
import { createClient } from "@/lib/supabase/server"
import { 
  AuthResult, 
  ErrorCode, 
  createError, 
  createAuthErrorResponse, 
  createAuthSuccessResponse 
} from "@/actions/error";

export default async function CheckServiceAdmin(): Promise<AuthResult> {
  try {
    console.log("CheckServiceAdmin: デバッグモードで常に成功を返します");
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return createAuthErrorResponse(
        '認証エラーが発生しました',
        createError(
          ErrorCode.AUTH_ERROR,
          authError.message || '認証エラーが発生しました'
        )
      );
    }

    if (!user) {
      return createAuthErrorResponse(
        'ログインが必要です',
        createError(
          ErrorCode.UNAUTHORIZED,
          'ログインが必要です'
        )
      );
    }

    if (user.email !== process.env.NEXT_PUBLIC_SERVICE_ADMIN_USER_EMAIL) {
      return createAuthErrorResponse(
        '権限がありません',
        createError(
          ErrorCode.FORBIDDEN,
          '権限がありません'
        )
      );
    }

    return createAuthSuccessResponse();

  } catch (error) {
    console.error('サービス管理者チェック中にエラーが発生しました:', error);
    return createAuthErrorResponse(
      '内部エラーが発生しました',
      createError(
        ErrorCode.INTERNAL_ERROR,
        '内部エラーが発生しました',
        error
      )
    );
  }
}
