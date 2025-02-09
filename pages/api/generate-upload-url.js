import { S3 } from '@aws-sdk/client-s3';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const s3 = new S3({
        endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',  // Must be 'auto' for R2
        credentials: {
            accessKeyId: process.env.CF_ACCESS_KEY_ID,
            secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
        },
    });

    const bucketName = process.env.CF_BUCKET_NAME;
    const key = `${Date.now()}-${req.query.filename}`; // Unique key for each file

    const params = {
        Bucket: bucketName,
        Key: key,
        Expires: 600, // URL valid for 10 minutes
    };

    try {
        const uploadURL = await s3.getSignedUrl('putObject', params);
        res.status(200).json({ uploadURL, objectURL: `https://${bucketName}.${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}` });
    } catch (error) {
        console.error("R2 Error:", error);
        res.status(500).json({ error: 'Failed to generate pre-signed URL' });
    }
}