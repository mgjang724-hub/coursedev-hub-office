import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getUsers() {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        user_id: true,
        name: true,
        email: true,
        global_role: true,
      },
      orderBy: { name: 'asc' },
    });
    return {
      success: true,
      data: users,
    };
  }
}
