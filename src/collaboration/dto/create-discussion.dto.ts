import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateDiscussionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;
}