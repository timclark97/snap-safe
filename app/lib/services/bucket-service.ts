import { AwsClient } from "aws4fetch";

if (
  !process.env.BUCKET_ACCESS_KEY ||
  !process.env.BUCKET_SECRET_KEY ||
  !process.env.BUCKET_ENDPOINT
) {
  throw new Error("Bucket credentials not found");
}

const bucket = new AwsClient({
  accessKeyId: process.env.BUCKET_ACCESS_KEY,
  secretAccessKey: process.env.BUCKET_SECRET_KEY,
  service: "s3"
});

export const createGetRequest = async (id: string) => {
  const req = await bucket.sign(
    process.env.BUCKET_ENDPOINT + "/" + id + "?X-Amz-Expires=100",
    {
      method: "GET",
      headers: {
        "content-type": "application/octet-stream"
      },
      aws: {
        signQuery: true
      }
    }
  );
  return { url: req.url };
};

export const createUploadRequest = async (id: string) => {
  const thing = new Request(
    `${process.env.BUCKET_ENDPOINT}/${id}?X-Amz-Expires=100`,
    { method: "PUT" }
  );
  const req = await bucket.sign(thing, {
    aws: {
      signQuery: true
    }
  });
  return { url: req.url };
};

export const deleteObject = async (id: string) => {
  const resp = await bucket.fetch(process.env.BUCKET_ENDPOINT + "/" + id, {
    method: "DELETE"
  });

  if (!resp.ok) {
    console.error(resp);
  }
};
