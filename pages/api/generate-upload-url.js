import { S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3({
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.CF_ACCESS_KEY_ID,
    secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { filename } = req.query;
      const bucketParams = {
        Bucket: process.env.CF_BUCKET_NAME,
        Key: filename,
      };
      const command = new PutObjectCommand(bucketParams);
      const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      res.status(200).json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL", error);
      res.status(500).json({ error: "Failed to generate pre-signed URL" });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}