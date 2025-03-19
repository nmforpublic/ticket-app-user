"use server";
import { db } from "@/db/drizzle";
import { organizations } from "@/db/schema";
import { revalidatePath } from "next/cache";
import CheckServiceAdmin from "./utils/checkServiceAdmin";
import { sql } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "@/actions/error";

type Organization = typeof organizations.$inferSelect;

// 団体の一覧取得
export const getOrganizations = async (): Promise<ActionResponse<Organization[]>> => {
  try {
    const data = await db.select().from(organizations);
    return createSuccessResponse<Organization[]>('団体一覧を取得しました', data);
  } catch (error) {
    console.error('団体一覧取得エラー:', error);
    return createErrorResponse(
      '団体一覧の取得に失敗しました',
      createError(
        ErrorCode.DATABASE_ERROR,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};

// 団体の作成
export const createOrganization = async (
  name: string, 
  description?: string
): Promise<ActionResponse> => {
  try {
    // 管理者権限チェック
    const authResult = await CheckServiceAdmin();
    if (!authResult.success) {
      return createErrorResponse(
        '権限エラー',
        authResult.error!
      );
    }

    // 入力値の検証
    if (!name || name.trim() === '') {
      return createErrorResponse(
        '団体名は必須です',
        createError(
          ErrorCode.VALIDATION_ERROR,
          '団体名を入力してください'
        )
      );
    }

    // 既存団体名チェック
    const existingOrg = await db.select({ id: organizations.id })
      .from(organizations)
      .where(sql`LOWER(${organizations.name}) = LOWER(${name.trim()})`)
      .limit(1);
    
    if (existingOrg.length > 0) {
      return createErrorResponse(
        '団体名が既に使用されています',
        createError(
          ErrorCode.DUPLICATE_ENTITY,
          'この団体名は既に登録されています'
        )
      );
    }

    // 団体の登録
    await db.insert(organizations).values({
      name: name.trim(),
      description: description?.trim(),
    });
    
    
    revalidatePath("/service-admin/organization");
    revalidatePath("/service-admin/admin-users");
    
    return createSuccessResponse('団体を作成しました');
  } catch (error) {
    console.error('団体作成エラー:', error);
    return createErrorResponse(
      '団体の作成に失敗しました',
      createError(
        ErrorCode.OPERATION_FAILED,
        error instanceof Error ? error.message : '不明なエラーが発生しました',
        error
      )
    );
  }
};
