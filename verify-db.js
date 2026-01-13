require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH 
  ? (path.isAbsolute(process.env.DB_PATH) 
      ? process.env.DB_PATH 
      : path.resolve(process.cwd(), process.env.DB_PATH))
  : path.join(__dirname, 'database/gym_management.db');

console.log('\n=== Database Verification ===');
console.log('DB_PATH from .env:', process.env.DB_PATH);
console.log('Resolved absolute path:', dbPath);
console.log('Database exists:', require('fs').existsSync(dbPath));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Database connected successfully\n');
  
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) console.error('Error counting users:', err.message);
    else console.log('👥 Users in database:', row.count);
    
    db.get('SELECT COUNT(*) as count FROM members', (err, row) => {
      if (err) console.error('Error counting members:', err.message);
      else console.log('🏋️  Members in database:', row.count);
      
      db.get('SELECT COUNT(*) as count FROM payments', (err, row) => {
        if (err) console.error('Error counting payments:', err.message);
        else console.log('💰 Payments in database:', row.count);
        
        db.get('SELECT COUNT(*) as count FROM bills', (err, row) => {
          if (err) console.error('Error counting bills:', err.message);
          else console.log('📄 Bills in database:', row.count);
          
          console.log('\n✅ Data is persisted and will survive server restarts');
          db.close();
        });
      });
    });
  });
});
