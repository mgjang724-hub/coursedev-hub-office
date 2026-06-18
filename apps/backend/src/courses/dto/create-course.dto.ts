import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty({ message: '과정명을 입력해주세요.' })
  @IsString()
  course_name: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  dev_type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lesson_count?: number;
}
