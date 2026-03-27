const multer = require('multer');
const { uploadFile, getPresignedUrl } = require('../services/s3Service');
const { auth } = require('../middleware/auth');
const express = require('express');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Upload a document to S3
 */
router.post('/', auth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const folder = req.body.folder || 'app-uploads';
        const fileName = `${Date.now()}-${req.file.originalname}`;
        
        const result = await uploadFile(req.file.buffer, fileName, folder, req.file.mimetype);
        
        res.status(201).json({
            message: 'File uploaded successfully',
            file_key: result.key,
            location: result.location
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

/**
 * Get a presigned URL to view a private file
 */
router.get('/view', auth, async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ message: 'File key required' });

    try {
        const url = await getPresignedUrl(key);
        res.json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating view URL' });
    }
});

module.exports = router;
