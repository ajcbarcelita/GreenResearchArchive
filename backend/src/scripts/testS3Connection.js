import dotenv from "dotenv";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import logger from "../utils/logger.js";

dotenv.config();

export const testS3Connection = async () => {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    await s3Client.send(
      new HeadBucketCommand({ Bucket: process.env.S3_BUCKET_NAME }),
    );

    logger.info("[SUCCESS] S3 bucket connection successful");
    return true;
  } catch (error) {
    logger.error(`[ERROR] S3 connection failed:`);
    logger.error(
      `HTTP Status: ${error?.$metadata?.httpStatusCode || "unknown"}`,
    );
    logger.error(`Error Code: ${error?.Code || error?.name || "unknown"}`);
    logger.error(`Message: ${error?.message || "unknown"}`);
    logger.error(`Request ID: ${error?.$metadata?.requestId || "unknown"}`);
    logger.error(`Bucket: ${process.env.S3_BUCKET_NAME}`);
    logger.error(`Region: ${process.env.AWS_REGION || "us-east-1"}`);
    return false;
  }
};
