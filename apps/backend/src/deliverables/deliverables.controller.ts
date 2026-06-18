import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { DeliverablesService } from './deliverables.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNotEmpty, IsString } from 'class-validator';

class FileUploadDto {
  @IsNotEmpty({ message: '파일명은 필수입니다.' })
  @IsString()
  file_name: string;

  @IsNotEmpty({ message: '파일 형식은 필수입니다.' })
  @IsString()
  file_type: string;
}

@Controller('deliverables')
@UseGuards(JwtAuthGuard)
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post(':id/files')
  async createUploadUrl(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: FileUploadDto,
  ) {
    const result = await this.deliverablesService.createPresignedUrl(
      id,
      req.user.userId,
      dto.file_name,
      dto.file_type,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/files')
  async getVersions(@Param('id') id: string) {
    const result = await this.deliverablesService.getVersions(id);
    return {
      success: true,
      data: result,
    };
  }
}
