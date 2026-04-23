import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  user: 'postgres', 
  host: 'localhost', 
  database: 'vialifecoach_db', 
  password: 'Si82monG@)$', 
  port: 5432 
});

async function checkUsersTable() {
  try {
    // Get columns
    const columns = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"
    );
    console.log('Users table columns:');
    console.log(JSON.stringify(columns.rows, null, 2));
    
    // Check if admin exists
    const admin = await pool.query("SELECT * FROM users WHERE email = 'academy@vialifecoach.org'");
    console.log('\nAdmin user:', admin.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
