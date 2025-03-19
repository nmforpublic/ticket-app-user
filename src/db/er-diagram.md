```mermaid
erDiagram
    ORGANIZATIONS {
      int id PK
      varchar name
      text description
      timestamp created_at
      timestamp updated_at
    }
    
    USERS {
      int id PK
      varchar name
      varchar email
      timestamp created_at
      timestamp updated_at
    }
    
    ORGANIZATION_USERS {
      int id PK
      int organization_id FK
      int user_id FK
      varchar role
      int guest_ticket_quota
      timestamp created_at
      timestamp updated_at
    }
    
    ORGANIZATION_USER_ROLE_HISTORY {
      int id PK
      int organization_user_id FK
      varchar old_role
      varchar new_role
      int changed_by FK
      text reason
      timestamp changed_at
    }
    
    USER_AUTHS {
      int id PK
      int user_id FK
      auth_provider provider
      varchar provider_identifier
      jsonb profile
      timestamp created_at
      timestamp updated_at
    }
    
    EVENTS {
      int id PK
      int organization_id FK
      varchar name
      text description
      text image_url
      timestamp start_datetime
      timestamp end_datetime
      numeric ticket_price
      int capacity
      boolean is_published
      int created_by FK
      timestamp created_at
      timestamp updated_at
    }
    
    TICKETS {
      int id PK
      int event_id FK
      int owner_user_id FK
      varchar ticket_type
      int issued_by FK
      varchar status
      timestamp issued_at
      timestamp used_at
      text qr_code_data
    }
    
    TICKET_LOGS {
      int id PK
      int ticket_id FK
      varchar action_type
      int old_owner_user_id
      int new_owner_user_id
      int changed_by FK
      text reason
      timestamp created_at
    }
    
    CHECKIN_LOGS {
      int id PK
      int ticket_id FK
      int scanned_by FK
      timestamp scanned_at
      jsonb additional_info
    }
    
    ORGANIZATIONS ||--o{ ORGANIZATION_USERS : "has"
    USERS ||--o{ ORGANIZATION_USERS : "belongs to"
    ORGANIZATION_USERS ||--o{ ORGANIZATION_USER_ROLE_HISTORY : "role history"
    USERS ||--o{ USER_AUTHS : "authenticates via"
    ORGANIZATIONS ||--o{ EVENTS : "hosts"
    ORGANIZATION_USERS ||--o{ EVENTS : "created by"
    EVENTS ||--o{ TICKETS : "issues"
    USERS ||--o{ TICKETS : "owns"
    TICKETS ||--o{ TICKET_LOGS : "logs"
    TICKETS ||--o{ CHECKIN_LOGS : "check-in logs"
```


### 説明

- **Organizations テーブル**  
  - 各団体（テナント）の情報を管理します。  
  - 主に団体名や説明、作成日時などを保持。

- **Users テーブル**  
  - グローバルなユーザー情報を管理します。  
  - ユーザー名、メールアドレスなどの基本情報を保存。

- **Organization_Users テーブル**  
  - ユーザーと団体の多対多の関係を管理し、団体ごとの役割（例：admin、operator、user）やゲストチケット発行上限などを保持。  
  - 同一ユーザーが複数の団体に所属でき、団体ごとに役割が異なる場合に対応。

- **Organization_User_Role_History テーブル**  
  - 団体内でのユーザーの役割変更履歴を記録。  
  - 変更前の役割、変更後の役割、変更を行ったユーザー（管理者）や理由、変更日時を保存。

- **User_Auths テーブル**  
  - Google と LINE の認証に特化したテーブル。  
  - プロバイダーは ENUM 型（auth_provider）で制限し、各プロバイダー固有のユニークIDやプロフィール情報（JSONB）を管理。

- **Events テーブル**  
  - 各団体が開催するイベントの情報を管理。  
  - イベント名、説明、画像URL、開始・終了日時、チケット価格、定員、公開状態、作成者（organization_users経由）などの情報を保持。  
  - イベントの更新は最新の状態のみを保存。

- **Tickets テーブル**  
  - イベントごとに発行されるチケット情報を管理。  
  - チケットは購入（purchased）か運営が発行するゲスト（guest）の区別が可能。  
  - また、所有者（ユーザー）、発行者（organization_users）、状態（active、used、cancelled）、発行日時、使用日時、QRコード情報などを含む。

- **Ticket_Logs テーブル**  
  - チケットに対するキャンセル、譲渡、使用などの操作履歴を記録。  
  - 譲渡の場合は、旧所有者、新所有者、操作実行者、理由、操作日時などを保存。

- **Checkin_Logs テーブル**  
  - 管理者がQRコードでチケットをスキャンした際のチェックインログを記録。  
  - スキャンしたチケット、スキャン担当者（organization_users）、スキャン日時、追加情報（JSONB）などを保持。