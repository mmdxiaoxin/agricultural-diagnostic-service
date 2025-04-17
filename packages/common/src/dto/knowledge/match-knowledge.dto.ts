import { IsNotEmpty, IsObject } from "class-validator";

export class MatchKnowledgeDto {
  @IsObject()
  @IsNotEmpty()
  query:  Record<string, any>;
}
