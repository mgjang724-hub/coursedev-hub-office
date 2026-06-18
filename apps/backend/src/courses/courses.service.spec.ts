import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('CoursesService - Business Rules', () => {
  let service: CoursesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: PrismaService,
          useValue: {
            course: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('RULE-02: Should return 0.0 progress rate if lesson count is 0 (divide-by-zero protection)', async () => {
    const mockCourse = {
      course_id: 'test-course-id',
      course_name: 'Test Course',
      status: 'ACTIVE',
      stages: [
        { id: '1', stage_type: '기획', stage_order: 1, status: 'NOT_STARTED', progress_rate: 0 },
      ],
      lessons: [],
    };

    jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(mockCourse as any);

    const result = await service.findOne('test-course-id');
    expect(result.progress_rate).toBe(0.0);
    expect(result.stages[0].progress_rate).toBe(0.0);
  });

  it('RULE-04: Should resolve derived_status priorities correctly (REVISION_REQUESTED > BLOCKED > IN_REVIEW > SUBMITTED > APPROVED > NOT_SUBMITTED)', async () => {
    const mockCourse = {
      course_id: 'test-course-id',
      course_name: 'Test Course',
      status: 'ACTIVE',
      stages: [],
      lessons: [
        {
          lesson_id: 'lesson-1',
          lesson_no: 1,
          title: 'Lesson 1',
          deliverables: [
            { deliverable_id: 'd1', deliverable_type: 'SCRIPT', current_status: 'APPROVED', blocking_reason: null },
            { deliverable_id: 'd2', deliverable_type: 'SB', current_status: 'REVISION_REQUESTED', blocking_reason: null },
          ],
        },
        {
          lesson_id: 'lesson-2',
          lesson_no: 2,
          title: 'Lesson 2',
          deliverables: [
            { deliverable_id: 'd3', deliverable_type: 'SCRIPT', current_status: 'APPROVED', blocking_reason: 'Wait for SME resource' },
            { deliverable_id: 'd4', deliverable_type: 'SB', current_status: 'SUBMITTED', blocking_reason: null },
          ],
        },
        {
          lesson_id: 'lesson-3',
          lesson_no: 3,
          title: 'Lesson 3',
          deliverables: [
            { deliverable_id: 'd5', deliverable_type: 'SCRIPT', current_status: 'APPROVED', blocking_reason: null },
          ],
        },
      ],
    };

    jest.spyOn(prisma.course, 'findUnique').mockResolvedValue(mockCourse as any);

    const result = await service.findOne('test-course-id');
    
    expect(result.lessons[0].derived_status).toBe('REVISION_REQUESTED');
    expect(result.lessons[1].derived_status).toBe('BLOCKED');
    expect(result.lessons[2].derived_status).toBe('APPROVED');
  });
});
