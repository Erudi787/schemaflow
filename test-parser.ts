import fs from 'fs';
import path from 'path';
import { parseSql } from './src/parsers/sql/sqlParser';
import { toReactFlow } from './src/transform/toReactFlow';
import { applyLayout } from './src/transform/layout';

const sqlContent = fs.readFileSync('C:\\Users\\Elwison Denampo\\.gemini\\antigravity\\brain\\2e25b7e9-9bd1-4e50-aafd-4499f729f02a\\advanced_test.sql', 'utf-8');

const parseResult = parseSql(sqlContent);

if (!parseResult.success) {
    console.error('PARSE FAILED:', parseResult.error);
    process.exit(1);
}

console.log('--- TABLES PARSED ---');
console.log(parseResult.data.tables.map(t => t.name));

console.log('\n--- TYPES EXTRACTED ---');
const usersTable = parseResult.data.tables.find(t => t.name === 'auth.users');
console.log('auth.users types:', usersTable?.fields.map(f => `${f.name}: ${f.type}`));

const paymentsTable = parseResult.data.tables.find(t => t.name === 'public.payments');
console.log('public.payments types:', paymentsTable?.fields.map(f => `${f.name}: ${f.type}`));

console.log('\n--- RELATIONSHIPS MAP ---');
parseResult.data.relationships.forEach(r => {
    console.log(`${r.from.table}.${r.from.field} -> ${r.to.table}.${r.to.field}`);
});

console.log('\n--- RUNNING DAGRE auto-layout ---');
const flowData = toReactFlow(parseResult.data);
try {
    const layouted = applyLayout(flowData);
    console.log('LAYOUT SUCCESS! Nodes processed:', layouted.nodes.length);
    console.log('Employees node layout bounds:', layouted.nodes.find(n => n.id === 'table-public.employees')?.position);
} catch (e) {
    console.error('LAYOUT FAILED:', e);
}
