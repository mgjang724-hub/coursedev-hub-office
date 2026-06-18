import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GlobalRole } from '@prisma/client';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(GlobalRole.PLANNER)
  async create(@Request() req, @Body() createCourseDto: CreateCourseDto) {
    const result = await this.coursesService.createDraft(req.user.userId, createCourseDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  async findAll(@Request() req) {
    const result = await this.coursesService.findAll(req.user.userId, req.user.role);
    return {
      success: true,
      data: result,
    };
  }

  @Get('planner/dashboard')
  @Roles(GlobalRole.PLANNER)
  async getDashboard(@Request() req) {
    const result = await this.coursesService.getPlannerDashboard(req.user.userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/heatmap')
  async getHeatmap(@Param('id') id: string) {
    const result = await this.coursesService.getHeatmap(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.coursesService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @Roles(GlobalRole.PLANNER)
  async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    const result = await this.coursesService.updateCourse(id, updateCourseDto);
    return {
      success: true,
      data: result,
    };
  }
}
