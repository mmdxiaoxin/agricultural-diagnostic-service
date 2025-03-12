export class TaskCreateDto {
  userId: number;
  fileName: string;
  totalChunks: number;
  fileMeta?: Express.Multer.File;
}
