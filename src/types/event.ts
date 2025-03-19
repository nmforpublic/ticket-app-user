// 運営者情報の型
export interface OperatorWithProfile {
  id: string;
  userId: number;
  name: string;
  username: string;
  image: string;
  provider?: string;
  guestLimit: number;
  isSelected: boolean;
}

// イベントチケット運営者情報の型
export interface EventTicketOperator {
  id: string;
  userId: number;
  name: string;
  username: string;
  image: string;
  provider?: string;
  allocation_quota: number;
  remaining_quota: number;
}

// ゲストチケット情報の型
export interface GuestTicketWithUser {
  id: string;
  name: string;
  username: string;
  image: string;
  issuedBy: {
    id: number;
    name: string;
  };
}
