import { db } from "@/db/drizzle";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  ActionResponse, 
  ErrorCode, 
  createError, 
  createSuccessResponse, 
  createErrorResponse 
} from "./error";

export const getOrganization = async (organizationId: number) => {
  try {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    if (!organization) {
      return createErrorResponse(
        '組織が見つかりませんでした',
        createError(ErrorCode.NOT_FOUND, '指定された組織IDの組織が存在しません')
      );
    }

    return createSuccessResponse('組織情報を取得しました', organization);
  } catch (error) {
    console.error('組織情報取得エラー:', error);
    return createErrorResponse(
      '組織情報の取得に失敗しました',
      createError(ErrorCode.DATABASE_ERROR, '組織情報の取得中にエラーが発生しました', error)
    );
  }
};
