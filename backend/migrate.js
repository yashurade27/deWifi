/**
 * MongoDB Migration Script
 * Migrates data from local MongoDB to Atlas
 */

const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/dewifi';
const ATLAS_URI = 'mongodb+srv://spandan_mali:spandan_mali@cluster0.zub3qxs.mongodb.net/dewifi?retryWrites=true&w=majority&appName=Cluster0';

async function migrateData() {
    console.log('🚀 Starting migration...\n');

    // Connect to LOCAL database
    console.log('📥 Connecting to LOCAL database...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to LOCAL database\n');

    // Connect to ATLAS database
    console.log('📤 Connecting to ATLAS database...');
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to ATLAS database\n');

    try {
        // Get all collections from local DB
        const collections = await localConn.db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections to migrate:\n`);

        for (const collInfo of collections) {
            const collectionName = collInfo.name;
            console.log(`   → Migrating "${collectionName}"...`);

            // Get all documents from local collection
            const localCollection = localConn.db.collection(collectionName);
            const documents = await localCollection.find({}).toArray();

            if (documents.length === 0) {
                console.log(`     ⚠️  No documents found in "${collectionName}"\n`);
                continue;
            }

            // Insert into Atlas collection
            const atlasCollection = atlasConn.db.collection(collectionName);

            // Clear existing data in Atlas (optional - comment out if you want to keep existing data)
            await atlasCollection.deleteMany({});

            // Insert all documents
            await atlasCollection.insertMany(documents);

            console.log(`     ✅ Migrated ${documents.length} documents\n`);
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await localConn.close();
        await atlasConn.close();
        console.log('\n🔒 Database connections closed');
    }
}

// Run migration
migrateData()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Error:', error);
        process.exit(1);
    });
