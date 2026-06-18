import { PrismaClient, GlobalRole, CourseStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Hash default password
  const passwordHash = await bcrypt.hash('test1234', 10);

  console.log('Seeding user accounts...');
  
  // 2. Create user accounts for each of the 5 roles
  const planner = await prisma.user.upsert({
    where: { email: 'planner@test.com' },
    update: {},
    create: {
      email: 'planner@test.com',
      name: '기획자 (Planner)',
      password_hash: passwordHash,
      global_role: GlobalRole.PLANNER,
      status: 'ACTIVE',
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@test.com' },
    update: {},
    create: {
      email: 'pm@test.com',
      name: '제작PM (PM)',
      password_hash: passwordHash,
      global_role: GlobalRole.PM,
      status: 'ACTIVE',
    },
  });

  const sme = await prisma.user.upsert({
    where: { email: 'sme@test.com' },
    update: {},
    create: {
      email: 'sme@test.com',
      name: '강사 (SME)',
      password_hash: passwordHash,
      global_role: GlobalRole.SME,
      status: 'ACTIVE',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: '어드민 (Admin)',
      password_hash: passwordHash,
      global_role: GlobalRole.ADMIN,
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      email: 'manager@test.com',
      name: '매니저 (Manager)',
      password_hash: passwordHash,
      global_role: GlobalRole.MANAGER,
      status: 'ACTIVE',
    },
  });

  console.log('Seeding sample active course with 5 lessons...');

  // 3. Create 1 active course with 5 lessons
  const course = await prisma.course.create({
    data: {
      course_name: '2026 AI 실무 활용 역량 강화 연수',
      lesson_count: 5,
      current_stage: '원고 집필',
      status: CourseStatus.ACTIVE,
      planner_id: planner.user_id,
      vendor: 'AX 테크놀로지',
      dev_type: '혼합형(Blended)',
      members: {
        create: [
          { user_id: planner.user_id, role_in_course: 'PLANNER' },
          { user_id: pm.user_id, role_in_course: 'PM' },
          { user_id: sme.user_id, role_in_course: 'SME' },
        ],
      },
      stages: {
        create: [
          { stage_type: '기획', stage_order: 1, status: 'APPROVED', progress_rate: 1.0 },
          { stage_type: '원고', stage_order: 2, status: 'IN_REVIEW', progress_rate: 0.2 },
          { stage_type: '제작', stage_order: 3, status: 'NOT_STARTED', progress_rate: 0.0 },
          { stage_type: '심사', stage_order: 4, status: 'NOT_STARTED', progress_rate: 0.0 },
        ],
      },
      lessons: {
        create: [
          { lesson_no: 1, title: 'AI 시대의 도래와 교원의 역할', subtitle: 'AI 트렌드 개괄', derived_status: 'APPROVED' },
          { lesson_no: 2, title: '생성형 AI 프롬프트 엔지니어링 기초', subtitle: '효과적인 프롬프트 작성 규칙', derived_status: 'IN_REVIEW' },
          { lesson_no: 3, title: '수업용 교육 콘텐츠 자동 제작 기법', subtitle: '텍스트 및 이미지 생성 도구 활용', derived_status: 'NOT_SUBMITTED' },
          { lesson_no: 4, title: 'AI 기반 피드백 및 학생 맞춤형 평가', subtitle: '맞춤형 개별 지도 기법', derived_status: 'NOT_SUBMITTED' },
          { lesson_no: 5, title: 'AI 교육 도구 활용의 윤리 및 한계', subtitle: '인공지능 윤리 가이드라인', derived_status: 'NOT_SUBMITTED' },
        ],
      },
    },
  });

  console.log(`Seeding completed. Created course: ${course.course_name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
