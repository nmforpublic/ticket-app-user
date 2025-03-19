import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// .envファイルを読み込む
config({ path: '.env' });

// マイグレーションを実行する関数
async function runMigration() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  
  console.log('マイグレーションを開始します...');
  console.log(`接続先: ${connectionString}`);
  
  // マイグレーション用の接続（一度に1つのクエリのみ）
  const migrationClient = postgres(connectionString, { max: 1 });
  
  try {
    // マイグレーションを実行
    await migrate(drizzle(migrationClient), { migrationsFolder: 'migrations' });
    console.log('マイグレーションが正常に完了しました！');
  } catch (error) {
    console.error('マイグレーション中にエラーが発生しました:', error);
  } finally {
    // 接続を閉じる
    await migrationClient.end();
  }
}

// スクリプトを実行
runMigration(); 