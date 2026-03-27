const sharp = require('sharp');

/**
 * Compresses an image buffer using sharp.
 * @param {Buffer} buffer - The image buffer to compress.
 * @param {number} quality - Compression quality (1-100).
 * @returns {Promise<Buffer>} - The compressed image buffer.
 */
const compressImage = async (buffer, quality = 80) => {
    try {
        const metadata = await sharp(buffer).metadata();
        let pipeline = sharp(buffer);

        // If it's a large image, resize it to a maximum of 2000px width/height while maintaining aspect ratio
        if (metadata.width > 2000 || metadata.height > 2000) {
            pipeline = pipeline.resize(2000, 2000, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Convert to progressive JPEG for better web loading
        return await pipeline
            .jpeg({ 
                quality,
                progressive: true,
                mozjpeg: true 
            })
            .toBuffer();
    } catch (error) {
        console.error('Compression Error:', error);
        // If compression fails, return the original buffer as a fallback
        return buffer;
    }
};

/**
 * Checks if a file is an image based on its mimetype.
 * @param {string} mimetype - The file's mimetype.
 * @returns {boolean}
 */
const isImage = (mimetype) => {
    return mimetype.startsWith('image/');
};

module.exports = {
    compressImage,
    isImage
};
