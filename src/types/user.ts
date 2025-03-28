export interface LineUser {
  id: string;
  lineId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage: string;
}

// UserAuthsの型定義
export type UserAuthsInfo = {
  id: number;
  user_id: number;
  provider: 'google' | 'line';
  provider_identifier: string;
  profile: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};