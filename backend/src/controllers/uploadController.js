const path = require('path');
const multer = require('multer');
const s3Service = require('../services/s3Service');
const compressionService = require('../services/compressionService');

// Multer setup for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, JPEG, PNG files allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @desc    Upload a file to S3
// @route   POST /api/uploads
const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        let buffer = req.file.buffer;
        let filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${req.file.originalname}`;

        // Compress if it's an image
        if (compressionService.isImage(req.file.mimetype)) {
            console.log(`[COMPRESSION] Compressing image: ${req.file.originalname}`);
            buffer = await compressionService.compressImage(buffer);
        }

        const folder = req.body.folder || 'legal-documents';
        const result = await s3Service.uploadFile(buffer, filename, folder, req.file.mimetype);

        res.status(201).json({
            message: 'File uploaded successfully to S3',
            file: {
                filename: result.key, // We store the full S3 key as filename for database consistency
                originalname: req.file.originalname,
                size: buffer.length,
                mimetype: req.file.mimetype,
                location: result.location
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Failed to upload to cloud storage' });
    }
};

// @desc    Redirect to a presigned S3 URL
// @route   GET /api/uploads/:filename
const getFile = async (req, res) => {
    try {
        const key = req.params.filename;
        // Check if it's a legacy local file or a new S3 key
        // Keys usually start with folder/ (e.g. legal-documents/)
        if (!key.includes('/')) {
            // Check if it exists locally first (for legacy support during migration)
            const legacyPath = path.join(process.cwd(), 'uploads', key);
            const fs = require('fs');
            if (fs.existsSync(legacyPath)) {
                return res.sendFile(legacyPath);
            }
        }

        const signedUrl = await s3Service.getPresignedUrl(key);
        res.redirect(signedUrl);
    } catch (error) {
        console.error('File Access Error:', error);
        res.status(404).json({ message: 'File not found or access denied' });
    }
};

// @desc    Delete a file from S3
// @route   DELETE /api/uploads/:filename
const deleteFile = async (req, res) => {
    try {
        const key = req.params.filename;
        await s3Service.deleteFile(key);
        res.json({ message: 'File deleted from S3' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Failed to delete file from cloud storage' });
    }
};

module.exports = { upload, uploadFile, getFile, deleteFile };
