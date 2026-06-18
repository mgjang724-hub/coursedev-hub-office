import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseStatus, GlobalRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createDraft(plannerId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        course_name: dto.course_name,
        vendor: dto.vendor,
        dev_type: dto.dev_type,
        lesson_count: dto.lesson_count || 0,
        current_stage: '기획',
        status: CourseStatus.DRAFT,
        planner_id: plannerId,
      },
    });
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
    });

    if (!course) {
      throw new NotFoundException('해당 과정을 찾을 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { course_id: courseId },
        data: {
          course_name: dto.course_name,
          vendor: dto.vendor,
          dev_type: dto.dev_type,
          lesson_count: dto.lesson_count,
          status: dto.status,
        },
      });

      if (dto.stages) {
        await tx.courseStage.deleteMany({
          where: { course_id: courseId },
        });

        await tx.courseStage.createMany({
          data: dto.stages.map((stage) => ({
            course_id: courseId,
            stage_type: stage.stage_type,
            stage_order: stage.stage_order,
            start_date: stage.start_date ? new Date(stage.start_date) : null,
            end_date: stage.end_date ? new Date(stage.end_date) : null,
            status: stage.status,
          })),
        });
      }

      if (dto.lessons) {
        await tx.lesson.deleteMany({
          where: { course_id: courseId },
        });

        await tx.lesson.createMany({
          data: dto.lessons.map((lesson) => ({
            course_id: courseId,
            lesson_no: lesson.lesson_no,
            title: lesson.title,
            subtitle: lesson.subtitle,
            derived_status: 'NOT_SUBMITTED',
          })),
        });
      }

      if (dto.members) {
        await tx.courseMember.deleteMany({
          where: { course_id: courseId },
        });

        await tx.courseMember.createMany({
          data: dto.members.map((member) => ({
            course_id: courseId,
            user_id: member.user_id,
            role_in_course: member.role_in_course,
          })),
        });
      }

      return updatedCourse;
    });
  }

  async findAll(userId: string, role: GlobalRole) {
    if (role === GlobalRole.PLANNER || role === GlobalRole.ADMIN || role === GlobalRole.MANAGER) {
      return this.prisma.course.findMany({
        orderBy: { course_name: 'asc' },
        include: {
          planner: {
            select: { name: true, email: true },
          },
        },
      });
    } else {
      return this.prisma.course.findMany({
        where: {
          status: CourseStatus.ACTIVE,
          members: {
            some: { user_id: userId },
          },
        },
        orderBy: { course_name: 'asc' },
        include: {
          planner: {
            select: { name: true, email: true },
          },
        },
      });
    }
  }

  async findOne(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { course_id: courseId },
      include: {
        planner: {
          select: { name: true, email: true },
        },
        stages: {
          orderBy: { stage_order: 'asc' },
        },
        lessons: {
          orderBy: { lesson_no: 'asc' },
          include: {
            deliverables: true,
          },
        },
        members: {
          include: {
            user: {
              select: { name: true, email: true, global_role: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('해당 과정을 찾을 수 없습니다.');
    }

    const totalLessons = course.lessons.length;
    
    const lessonsWithStatus = course.lessons.map((lesson) => {
      const statuses = lesson.deliverables.map((d) => {
        if (d.blocking_reason && d.blocking_reason.trim().length > 0) {
          return 'BLOCKED';
        }
        return d.current_status;
      });

      let derivedStatus = 'NOT_SUBMITTED';
      if (statuses.includes('REVISION_REQUESTED')) {
        derivedStatus = 'REVISION_REQUESTED';
      } else if (statuses.includes('BLOCKED')) {
        derivedStatus = 'BLOCKED';
      } else if (statuses.includes('IN_REVIEW')) {
        derivedStatus = 'IN_REVIEW';
      } else if (statuses.includes('SUBMITTED')) {
        derivedStatus = 'SUBMITTED';
      } else if (statuses.includes('APPROVED')) {
        derivedStatus = 'APPROVED';
      } else {
        derivedStatus = 'NOT_SUBMITTED';
      }

      return {
        ...lesson,
        derived_status: derivedStatus,
      };
    });

    const approvedLessonsCount = lessonsWithStatus.filter(l => l.derived_status === 'APPROVED').length;
    const progressRate = totalLessons === 0 ? 0.0 : approvedLessonsCount / totalLessons;

    const stagesWithCalculatedProgress = course.stages.map((stage) => {
      return {
        ...stage,
        progress_rate: progressRate,
      };
    });

    return {
      ...course,
      lessons: lessonsWithStatus,
      stages: stagesWithCalculatedProgress,
      progress_rate: progressRate,
    };
  }

  async getHeatmap(courseId: string) {
    const data = await this.findOne(courseId);
    return {
      course_id: data.course_id,
      course_name: data.course_name,
      lessons: data.lessons.map((lesson) => ({
        lesson_id: lesson.lesson_id,
        lesson_no: lesson.lesson_no,
        title: lesson.title,
        subtitle: lesson.subtitle,
        derived_status: lesson.derived_status,
        deliverables: lesson.deliverables,
      })),
    };
  }

  async getPlannerDashboard(plannerId: string) {
    const myCoursesCount = await this.prisma.course.count({
      where: { planner_id: plannerId, status: CourseStatus.ACTIVE },
    });

    const activeCourses = await this.prisma.course.findMany({
      where: { planner_id: plannerId, status: CourseStatus.ACTIVE },
      include: {
        lessons: {
          include: {
            deliverables: true,
          },
        },
        stages: true,
      },
    });

    let pendingReviewCount = 0;
    const actionNeededTasks: any[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let thisMonthAuditCount = 0;

    for (const course of activeCourses) {
      const auditStage = course.stages.find((s) => s.stage_type === '심사');
      if (auditStage && auditStage.end_date) {
        const endDate = new Date(auditStage.end_date);
        if (endDate >= startOfMonth && endDate <= endOfMonth) {
          thisMonthAuditCount++;
        }
      }

      for (const lesson of course.lessons) {
        for (const dlv of lesson.deliverables) {
          if (dlv.current_status === 'SUBMITTED') {
            pendingReviewCount++;
            actionNeededTasks.push({
              id: dlv.deliverable_id,
              course_id: course.course_id,
              course_name: course.course_name,
              lesson_no: lesson.lesson_no,
              type: '검수 대기',
              title: `${lesson.lesson_no}차시 ${dlv.deliverable_type} 제출본 검수 요청`,
              status: dlv.current_status,
            });
          }
          if (dlv.current_status === 'REVISION_REQUESTED') {
            actionNeededTasks.push({
              id: dlv.deliverable_id,
              course_id: course.course_id,
              course_name: course.course_name,
              lesson_no: lesson.lesson_no,
              type: 'SME 답변 대기',
              title: `${lesson.lesson_no}차시 ${dlv.deliverable_type} 수정요청 진행 중`,
              status: dlv.current_status,
            });
          }
        }
      }
    }

    const coursesTable = activeCourses.map((c) => {
      const total = c.lessons.length;
      let approved = 0;
      for (const l of c.lessons) {
        const statuses = l.deliverables.map((d) => d.current_status);
        const hasApproved = statuses.includes('APPROVED') && !statuses.includes('REVISION_REQUESTED') && !statuses.includes('IN_REVIEW') && !statuses.includes('SUBMITTED');
        if (hasApproved) approved++;
      }
      const progress = total === 0 ? 0 : approved / total;

      return {
        course_id: c.course_id,
        course_name: c.course_name,
        vendor: c.vendor,
        dev_type: c.dev_type,
        current_stage: c.current_stage,
        progress_rate: progress,
      };
    });

    return {
      kpis: {
        my_courses_count: myCoursesCount,
        pending_reviews_count: pendingReviewCount,
        this_month_audit_count: thisMonthAuditCount,
      },
      action_needed_tasks: actionNeededTasks,
      courses: coursesTable,
    };
  }
}
