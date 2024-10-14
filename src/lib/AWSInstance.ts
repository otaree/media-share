import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "";
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      result += decoder.decode(value, { stream: true });
    }
  }
  return result;
}

class AWSInsance {
  readonly bucket: string;
  readonly s3Client: S3Client;

  constructor() {
    this.bucket = import.meta.env.VITE_AWS_BUCKET;
    this.s3Client = new S3Client({
      region: import.meta.env.VITE_AWS_REGION,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_ACCESS_SECRET,
      },
    });
  }

  getS3ImageUrl(bucketName: string, key: string) {
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  }

  async listFolders(): Promise<string[]> {
    const folders: string[] = [];

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Delimiter: "/", // This tells S3 to return only prefixes (folders)
      });

      const data: ListObjectsV2CommandOutput = await this.s3Client.send(
        command
      );

      // Check if CommonPrefixes is defined
      const commonPrefixes =
        data.CommonPrefixes?.map((prefix) => prefix.Prefix) || [];
      if (commonPrefixes) {
        folders.push(...(commonPrefixes as string[]));
      }
    } catch (error) {
      console.error("Error listing folders:", error);
    }

    return folders; // Return the list of folder names
  }

  async getFile(fileName: string, folderName?: string): Promise<string | null> {
    const key = folderName ? `${folderName}/${fileName}` : fileName; // Construct the full S3 key

    try {
      // Create a command to get the object
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      // Send the command to S3
      const response: GetObjectCommandOutput = await this.s3Client.send(
        command
      );

      // If the file exists, return its URL
      if (response.Body) {
        console.log("data:::", response.Body);
        return this.getS3ImageUrl(this.bucket, key);
      }
    } catch (error) {
      console.error("Error getting file:", error);
    }

    return null; // Return null if the file doesn't exist or an error occurred
  }

  async getFileJson(fileName: string, folderName?: string) {
    const key = folderName ? `${folderName}/${fileName}` : fileName; // Construct the full S3 key

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key, // The file path in the S3 bucket
      });

      const response = await this.s3Client.send(command);

      // Convert the response body (stream) to a string
      const jsonString = await streamToString(response.Body as ReadableStream);

      // Parse the JSON string into a JavaScript object
      const data = JSON.parse(jsonString);
      return data; // Return the parsed JSON object
    } catch (error) {
      console.error("Error reading JSON file:", error);
      return null;
    }
  }

  async listFiles(
    folderName: string = "",
    maxKeys: number = 100
  ): Promise<string[]> {
    const allFiles: string[] = [];
    let continuationToken: string | undefined = undefined;

    try {
      do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: this.bucket,
          ...(folderName && { Prefix: `${folderName}/` }),
          MaxKeys: maxKeys,
          ContinuationToken: continuationToken, // Pass the token to get the next page
        });

        const data = await this.s3Client.send(command);

        // Check if Contents is defined
        const files = data.Contents?.map((file) => file.Key as string) || [];
        allFiles.push(
          ...files.map((key) => this.getS3ImageUrl(this.bucket, key))
        );

        // Update continuationToken for the next request
        continuationToken = data.NextContinuationToken;
      } while (continuationToken); // Continue until there are no more tokens
    } catch (error) {
      console.error("Error listing files:", error);
    }

    return allFiles;
  }

  async uploadFile(file: File, folderName: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: `${folderName}/${file.name}`, // Store in an album folder
        Body: file,
        ContentType: file.type,
      });
      const response = await this.s3Client.send(command);
      console.log("File uploaded successfully:", response);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  async deleteFile(folderName: string, fileName: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: `${folderName}/${fileName}`,
      });
      const response = await this.s3Client.send(command);
      console.log("File deleted successfully:", response);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  async uploadJsonFile(
    fileName: string,
    data: object,
    folderName?: string
  ): Promise<void> {
    const jsonString = JSON.stringify(data); // Convert the object to JSON

    const key = folderName
      ? `${folderName}/${fileName}.json`
      : `${fileName}.json`; // Construct the file path (key)

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: jsonString, // Upload the JSON string
        ContentType: "application/json", // Set the content type to JSON
      });

      const response = await this.s3Client.send(command);
      console.log("File uploaded successfully:", response);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }
}

export default new AWSInsance();
