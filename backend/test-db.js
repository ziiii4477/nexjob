require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.time('MongoDB Connection Time');
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 2000,
            maxPoolSize: 50
        });
        console.timeEnd('MongoDB Connection Time');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // 测试数据库操作
        const testDoc = await mongoose.connection.db.collection('test').insertOne({
            test: 'speed_test',
            timestamp: new Date()
        });
        console.log('Test document inserted');
        
        // 清理测试数据
        await mongoose.connection.db.collection('test').deleteOne({
            _id: testDoc.insertedId
        });
        console.log('Test document cleaned up');
        
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB(); 