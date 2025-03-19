"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import CheckServiceAdmin from "./utils/checkServiceAdmin";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "@/actions/error";

type CreateAdminUserResponse = {
  userId: string | undefined;
};

// 管理者ユーザーの作成
export const createAdminUser = async (email: string, password: string, organization_id: number): Promise<ActionResponse<CreateAdminUserResponse>> => {
  try {
    // 管理者権限チェック
    const authResult = await CheckServiceAdmin();
    if (!authResult.success) {
      return createErrorResponse(
        '権限エラー',
        authResult.error!
      );
    }

    const supabase = await createClient();

    // 既存ユーザーチェック
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116は「データが見つからない」エラー
      console.error('ユーザーチェックエラー:', checkError);
      return createErrorResponse(
        'ユーザーチェック中にエラーが発生しました',
        createError(
          ErrorCode.DATABASE_ERROR,
          'ユーザーチェック中にエラーが発生しました',
          checkError
        )
      );
    }

    if (existingUser) {
      return createErrorResponse(
        'メールアドレスが既に使用されています',
        createError(
          ErrorCode.DUPLICATE_ENTITY,
          'このメールアドレスは既に登録されています'
        )
      );
    }

    // ユーザーの作成
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (signUpError) {
      console.error('ユーザー作成エラー:', signUpError);
      return createErrorResponse(
        'ユーザーの作成に失敗しました',
        createError(
          ErrorCode.OPERATION_FAILED,
          signUpError.message,
          signUpError
        )
      );
    }

    // ユーザー情報の保存
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user?.id,
        email: email,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('ユーザー情報保存エラー:', insertError);
      return createErrorResponse(
        'ユーザー情報の保存に失敗しました',
        createError(
          ErrorCode.DATABASE_ERROR,
          'ユーザー情報の保存に失敗しました',
          insertError
        )
      );
    }

    // 組織ユーザーとして管理者登録
    const { error: orgUserError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: organization_id,
        user_id: userData.id,
        role: 'admin',
      });

    if (orgUserError) {
      console.error('組織ユーザー登録エラー:', orgUserError);
      return createErrorResponse(
        '組織への管理者登録に失敗しました',
        createError(
          ErrorCode.DATABASE_ERROR,
          '組織への管理者登録に失敗しました',
          orgUserError
        )
      );
    }

    revalidatePath("/service-admin/admin-users");
    
    return createSuccessResponse(
      '管理者ユーザーを作成しました',
      { userId: authData.user?.id }
    );
  } catch (error) {
    console.error('管理者ユーザー作成エラー:', error);
    return createErrorResponse(
      '管理者ユーザーの作成に失敗しました',
      createError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};



// 管理者ユーザーのログイン
export const adminUserLogin = async (email: string, password: string): Promise<ActionResponse> => {
    try {
      // 入力値の検証
      if (!email || !password) {
        return createErrorResponse(
          'メールアドレスとパスワードは必須です',
          createError(
            ErrorCode.VALIDATION_ERROR,
            'メールアドレスとパスワードを入力してください'
          )
        );
      }
  
      const supabase = await createClient();
  
      // ログイン処理
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
  
      if (signInError) {
        console.error('ログインエラー:', signInError);
        return createErrorResponse(
          'ログインに失敗しました',
          createError(
            ErrorCode.AUTH_ERROR,
            signInError.message,
            signInError
          )
        );
      }
  
      if (!authData.user) {
        return createErrorResponse(
          'ユーザー情報の取得に失敗しました',
          createError(
            ErrorCode.AUTH_ERROR,
            'ユーザー情報の取得に失敗しました'
          )
        );
      }


      console.log('ログイン成功:', { userId: authData.user.id, email: authData.user.email });
      
      // セッションの更新
      revalidatePath('/', 'layout');
      
      return createSuccessResponse('ログインに成功しました');
    } catch (error) {
      console.error('ログインエラー:', error);
      return createErrorResponse(
        'ログイン処理中にエラーが発生しました',
        createError(
          ErrorCode.INTERNAL_ERROR,
          error instanceof Error ? error.message : '不明なエラーが発生しました',
          error
        )
      );
    }
  };
  