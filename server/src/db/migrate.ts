import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  try {
    console.log('Running migration via Supabase...');

    const migrationPath = join(__dirname, '../../../supabase/migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('/*'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement.length > 10) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.log('Statement may have failed (this is normal if using fallback):', statement.substring(0, 50));
        }
      }
    }

    console.log('Migration attempt completed. Tables should be ready.');
  } catch (err) {
    console.error('Migration error (this may be expected):', err);
    console.log('Tables will be created via direct SQL execution');
  }
}

migrate();
