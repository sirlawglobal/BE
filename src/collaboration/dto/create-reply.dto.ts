import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateReplyDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsUUID()
  discussionId: string;
}
