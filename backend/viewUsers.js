/**
 * View All Users Script
 * Displays all users from the database
 */

const mongoose = require('mongoose');
const ATLAS_URI = 'mongodb+srv://spandan_mali:spandan_mali@cluster0.zub3qxs.mongodb.net/airlink?retryWrites=true&w=majority&appName=Cluster0';

async function viewUsers() {
  try {
    console.log('🔌 Connecting to database...\n');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to database\n');

    // Get all users
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();

    if (users.length === 0) {
      console.log('⚠️  No users found in database\n');
      return;
    }

    console.log(`👥 Found ${users.length} users:\n`);
    console.log('─'.repeat(100));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Name: ${user.name || 'N/A'}`);
      console.log(`   🎭 Role: ${user.role || 'user'}`);
      console.log(`   📅 Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}`);
    });

    console.log('\n' + '─'.repeat(100));
    console.log(`\n📊 Total: ${users.length} users`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the script
viewUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
