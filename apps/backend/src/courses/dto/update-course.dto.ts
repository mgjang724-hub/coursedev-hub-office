import { IsOptional, IsString, IsArray, IsEnum, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CourseStatus } from '@prisma/client';

class StageDto {
  @IsString()
  stage_type: string;

  @IsInt()
  stage_order: number;

  @IsOptional()
  start_date?: string;

  @IsOptional()
  end_date?: string;

  @IsString()
  status: string;
}

class LessonDto {
  @IsInt()
  lesson_no: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;
}

class MemberDto {
  @IsString()
  user_id: string;

  @IsString()
  role_in_course: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  course_name?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  dev_type?: string;

  @IsOptional()
  @IsInt()
  lesson_count?: number;

  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageDto)
  stages?: StageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  lessons?: LessonDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members?: MemberDto[];
}
