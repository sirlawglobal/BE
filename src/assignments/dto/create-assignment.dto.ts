import { IsNotEmpty, IsString, IsDateString, IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Final Project' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Complete the full integration...' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: '2023-12-31T23:59:59.999Z' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: Date;

  @ApiProperty({ description: 'The course ID this assignment belongs to' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Total points for the assignment', default: 100 })
  @IsNumber()
  @IsOptional()
  points?: number;
}