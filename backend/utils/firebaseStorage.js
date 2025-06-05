const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { storage } = require('../config/firebase');

/**
 * 上传文件到 Firebase Storage
 * @param {Buffer} fileBuffer - 文件buffer
 * @param {string} fileName - 文件名
 * @param {string} folder - 存储文件夹路径
 * @returns {Promise<string>} 文件的下载URL
 */
const uploadToFirebase = async (fileBuffer, fileName, folder = 'images') => {
    try {
        // 创建文件引用
        const fileRef = ref(storage, `${folder}/${Date.now()}-${fileName}`);
        
        // 上传文件
        const snapshot = await uploadBytes(fileRef, fileBuffer);
        
        // 获取下载URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error('Firebase Storage上传失败:', error);
        throw new Error('文件上传失败');
    }
};

module.exports = { uploadToFirebase }; 