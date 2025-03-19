import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({ path: ".env" }); // or .env.local

// PostgreSQL接続文字列
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// PostgreSQLクライアントを作成
const client = postgres(connectionString);

// Drizzle ORMのインスタンスを作成（スキーマを含む）
export const db = drizzle(client, { schema });
