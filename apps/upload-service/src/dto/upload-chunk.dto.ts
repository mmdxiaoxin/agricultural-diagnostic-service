export class UploadChunkDto {
  chunkMeta: Express.Multer.File & {
    taskId: string;
    chunkIndex: number;
    totalChunks: number;
  };
  chunkData: Buffer;
}
