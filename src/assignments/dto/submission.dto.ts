import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({ description: 'The ID of the assignment this submission belongs to' })
  @IsUUID()
  @IsNotEmpty()
  assignmentId: string;

  @ApiProperty({ example: 'https://cloudinary.com/v1/...' })
  @IsString()
  @IsNotEmpty()
  contentUrl: string;
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 85, description: 'The numeric grade' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  grade: number;

  @ApiProperty({ example: 'Great work but review the UI design...' })
  @IsString()
  @IsOptional()
  feedback?: string;
}
