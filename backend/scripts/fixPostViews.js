const mongoose = require('mongoose');
const Post = require('../models/Post');
require('dotenv').config({ path: __dirname + '/../.env' });

async function fixViews() {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const result = await Post.updateMany(
        { views: { $exists: false } },
        { $set: { views: 0 } }
    );
    console.log('已修复帖子数量:', result.modifiedCount);
    await mongoose.disconnect();
}

fixViews(); 