const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadFile = async (fileBuffer, fileName, folder = 'legal-documents', mimetype = 'application/octet-stream') => {
    const key = `${folder}/${fileName}`;
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
    };

    try {
        await s3Client.send(new PutObjectCommand(params));
        return {
            key,
            bucket: process.env.AWS_S3_BUCKET,
            location: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`
        };
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw new Error('Failed to upload file to S3');
    }
};

const getPresignedUrl = async (key, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
        console.error('S3 Get Error:', error);
        throw new Error('Failed to generate presigned URL');
    }
};

const deleteFile = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        });
        await s3Client.send(command);
    } catch (error) {
        console.error('S3 Delete Error:', error);
        throw new Error('Failed to delete file from S3');
    }
};

module.exports = {
    uploadFile,
    getPresignedUrl,
    deleteFile
};
