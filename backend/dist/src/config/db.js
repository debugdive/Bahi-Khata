"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolWrapper = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pgPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
});
pgPool.connect()
    .then((client) => {
    console.log('Successfully connected to the PostgreSQL database.');
    client.release();
})
    .catch((err) => {
    console.error('Database connection failed:', err.message);
});
// Helper to convert MySQL SQL dialect & ? parameters to PostgreSQL syntax
function transformQuery(sql) {
    let transformed = sql;
    // Convert MySQL `ON DUPLICATE KEY UPDATE` to Postgres `ON CONFLICT` syntax if present
    if (/ON DUPLICATE KEY UPDATE/i.test(transformed)) {
        transformed = transformed.replace(/ON DUPLICATE KEY UPDATE/gi, 'ON CONFLICT (subscription_id, date) DO UPDATE SET');
        transformed = transformed.replace(/VALUES\(([^)]+)\)/gi, 'EXCLUDED.$1');
    }
    const isInsert = /^\s*INSERT\s+INTO/i.test(transformed);
    const isUpdateOrDelete = /^\s*(UPDATE|DELETE)/i.test(transformed);
    // If it's an INSERT statement without RETURNING, append RETURNING * so insertId can be captured
    if (isInsert && !/RETURNING/i.test(transformed)) {
        transformed = transformed.trim().replace(/;$/, '') + ' RETURNING *';
    }
    // Convert ? parameter placeholders to $1, $2, $3...
    let paramIndex = 1;
    transformed = transformed.replace(/\?/g, () => `$${paramIndex++}`);
    return { sql: transformed, isInsert, isUpdateOrDelete };
}
// Executes a query on a given client/pool and formats the return value like mysql2
async function executeQuery(executor, sql, params = []) {
    const { sql: formattedSql, isInsert, isUpdateOrDelete } = transformQuery(sql);
    const res = await executor.query(formattedSql, params);
    if (isInsert) {
        const insertedRow = res.rows[0] || {};
        const header = {
            insertId: insertedRow.id !== undefined ? insertedRow.id : null,
            id: insertedRow.id !== undefined ? insertedRow.id : null,
            affectedRows: res.rowCount || 0,
            ...insertedRow
        };
        return [header, res.fields];
    }
    if (isUpdateOrDelete) {
        const header = {
            affectedRows: res.rowCount || 0,
            changedRows: res.rowCount || 0
        };
        return [header, res.fields];
    }
    // For SELECT queries, return [rows, fields]
    return [res.rows, res.fields];
}
exports.poolWrapper = {
    async execute(sql, params) {
        return executeQuery(pgPool, sql, params);
    },
    async query(sql, params) {
        return executeQuery(pgPool, sql, params);
    },
    async getConnection() {
        const client = await pgPool.connect();
        return {
            async execute(sql, params) {
                return executeQuery(client, sql, params);
            },
            async query(sql, params) {
                return executeQuery(client, sql, params);
            },
            async beginTransaction() {
                await client.query('BEGIN');
            },
            async commit() {
                await client.query('COMMIT');
            },
            async rollback() {
                await client.query('ROLLBACK');
            },
            release() {
                client.release();
            }
        };
    }
};
exports.default = exports.poolWrapper;
