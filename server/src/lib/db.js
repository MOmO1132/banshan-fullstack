// 数据库访问层：封装 node:sqlite（Node 22 内置），提供 get/all/run/tx 四个基础方法
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'banshan.db');
export const db = new DatabaseSync(DB_PATH);

const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');

/** 建表（幂等） */
export function initSchema() {
  db.exec(schema);
}

export function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

export function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

export function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

/**
 * 事务包装：fn 内抛错则整体回滚。
 * 电商下单、点赞计数、采纳答案等「多表联动」都走这里，保证数据一致性。
 */
export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* 忽略回滚异常 */ }
    throw err;
  }
}
