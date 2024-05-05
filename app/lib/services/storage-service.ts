import { AwsClient } from "aws4fetch";

if (
  !process.env.STORAGE_ACCESS_KEY ||
  !process.env.STORAGE_SECRET_KEY ||
  !process.env.STORAGE_ENDPOINT
) {
  throw new Error("STORAGE credentials not found");
}

const STORAGE = new AwsClient({
  accessKeyId: process.env.STORAGE_ACCESS_KEY,
  secretAccessKey: process.env.STORAGE_SECRET_KEY,
  service: "s3"
});

export const createGetRequest = async (id: string) => {
  const req = await STORAGE.sign(
    process.env.STORAGE_ENDPOINT + "/" + id + "?X-Amz-Expires=100",
    {
      method: "GET",
      headers: {
        "content-type": "application/octet-stream"
      },
      aws: {
        signQuery: true,
        allHeaders: true
      }
    }
  );
  return { url: req.url };
};

export const createUploadRequest = async (id: string, contentLength: number) => {
  const thing = new Request(`${process.env.STORAGE_ENDPOINT}/${id}?X-Amz-Expires=100`, {
    method: "PUT",
    headers: {
      "content-type": "application/octet-stream",
      "content-length": contentLength.toString()
    }
  });
  const req = await STORAGE.sign(thing, {
    aws: {
      signQuery: true,
      allHeaders: true
    }
  });
  return { url: req.url };
};

export const deleteObject = async (id: string) => {
  const resp = await STORAGE.fetch(process.env.STORAGE_ENDPOINT + "/" + id, {
    method: "DELETE"
  });

  if (!resp.ok) {
    console.error(resp);
  }
};
