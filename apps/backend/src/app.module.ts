import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './courses/courses.module';
import { DeliverablesModule } from './deliverables/deliverables.module';

@Module({
  imports: [AuthModule, PrismaModule, CoursesModule, DeliverablesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
