export class UploadChunkDto {
  taskMeta: {
    taskId: string;
    chunkIndex: number;
    totalChunks: number;
  };
  chunkData: string;
}
