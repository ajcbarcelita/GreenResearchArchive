import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

const getS3Client = () =>
  new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

const assertBucketConfigured = () => {
  if (!S3_BUCKET_NAME) {
    const error = new Error("S3_BUCKET_NAME is not configured.");
    error.statusCode = 500;
    throw error;
  }
};

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const createObject = async ({
  key,
  body,
  contentType = "application/octet-stream",
  metadata = {},
}) => {
  assertBucketConfigured();

  if (!key || !String(key).trim()) {
    throw new Error("S3 object key is required.");
  }

  if (body === undefined || body === null) {
    throw new Error("S3 object body is required.");
  }

  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: String(key).trim(),
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    }),
  );

  return {
    bucket: S3_BUCKET_NAME,
    key: String(key).trim(),
  };
};

export const readObject = async ({ key, as = "buffer" }) => {
  assertBucketConfigured();

  if (!key || !String(key).trim()) {
    throw new Error("S3 object key is required.");
  }

  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: String(key).trim(),
    }),
  );

  const bodyStream = response.Body;
  if (!bodyStream) {
    const error = new Error("S3 object body is empty.");
    error.statusCode = 404;
    throw error;
  }

  if (as === "stream") {
    return {
      key: String(key).trim(),
      contentType: response.ContentType || null,
      contentLength: response.ContentLength || null,
      metadata: response.Metadata || {},
      body: bodyStream,
    };
  }

  const buffer = await streamToBuffer(bodyStream);

  if (as === "text") {
    return {
      key: String(key).trim(),
      contentType: response.ContentType || null,
      contentLength: response.ContentLength || null,
      metadata: response.Metadata || {},
      body: buffer.toString("utf-8"),
    };
  }

  return {
    key: String(key).trim(),
    contentType: response.ContentType || null,
    contentLength: response.ContentLength || null,
    metadata: response.Metadata || {},
    body: buffer,
  };
};

export const updateObject = async ({
  key,
  body,
  contentType = "application/octet-stream",
  metadata = {},
}) => {
  // In S3, update is implemented as overwrite using PutObject.
  return createObject({ key, body, contentType, metadata });
};

export const deleteObject = async ({ key }) => {
  assertBucketConfigured();

  if (!key || !String(key).trim()) {
    throw new Error("S3 object key is required.");
  }

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: String(key).trim(),
    }),
  );

  return {
    bucket: S3_BUCKET_NAME,
    key: String(key).trim(),
    deleted: true,
  };
};

export const listObjects = async ({ prefix = "", maxKeys = 100 } = {}) => {
  assertBucketConfigured();

  const client = getS3Client();
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );

  return {
    bucket: S3_BUCKET_NAME,
    prefix,
    keyCount: response.KeyCount || 0,
    contents: (response.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified || null,
      eTag: item.ETag || null,
    })),
  };
};

export const objectExists = async ({ key }) => {
  assertBucketConfigured();

  if (!key || !String(key).trim()) {
    throw new Error("S3 object key is required.");
  }

  const client = getS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: String(key).trim(),
      }),
    );
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
      return false;
    }
    throw error;
  }
};

export default {
  createObject,
  readObject,
  updateObject,
  deleteObject,
  listObjects,
  objectExists,
};
