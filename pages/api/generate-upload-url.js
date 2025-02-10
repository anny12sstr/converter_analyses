import { S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createRequest } from "@aws-sdk/util-create-request";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import { SignatureV4 } from "@smithy/signature-v4";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { AwsCredentialIdentity } from "@aws-sdk/types";

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
        signer: new SignatureV4({
      credentials: new AwsCredentialIdentity({
        accessKeyId: process.env.CF_ACCESS_KEY_ID,
        secretAccessKey: process.env.CF_SECRET_ACCESS_KEY,
      }),
      region: 'auto',
      service: 's3',
      sha256: Hash.bind(null, "SHA-256"),
    }),
        requestHandler: new NodeHttpHandler()
    });

    const bucketName = process.env.CF_BUCKET_NAME;
    const key = `${Date.now()}-${req.query.filename}`; // Unique key for each file

    try {
                const command = {
        Bucket: bucketName,
        Key: key
    };

    const request = await createRequest(s3.middlewareStack, {
        Bucket: bucketName,
        Key: key
    }, {
        clientName: 'S3Client',
        commandName: 'GetObjectCommand'
    });

        const uploadURL = await getSignedUrl(s3, command, {
            expiresIn: 3600, // 1 hour
        });
        res.status(200).json({ uploadURL, objectURL: `https://${bucketName}.${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}` });
    } catch (error) {
        console.error("R2 Error:", error);
        res.status(500).json({ error: 'Failed to generate pre-signed URL' });
    }
}