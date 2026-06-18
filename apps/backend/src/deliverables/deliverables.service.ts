import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DeliverablesService {
  private s3Client: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async createPresignedUrl(deliverableId: string, userId: string, fileName: string, fileType: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { deliverable_id: deliverableId },
      include: {
        lesson: {
          select: {
            course_id: true,
            lesson_id: true,
          },
        },
      },
    });

    if (!deliverable) {
      throw new NotFoundException('해당 산출물을 찾을 수 없습니다.');
    }

    const courseId = deliverable.lesson.course_id;
    const lessonId = deliverable.lesson.lesson_id;

    const versionCount = await this.prisma.fileVersion.count({
      where: { deliverable_id: deliverableId },
    });
    const roundNo = versionCount + 1;

    const cleanFileName = fileName.replace(/\s+/g, '_');
    const s3Key = `courses/${courseId}/lessons/${lessonId}/deliverables/${deliverableId}/r${roundNo}_${cleanFileName}`;

    let uploadUrl = '';
    const bucket = process.env.R2_BUCKET || 'coursedev-hub-files';

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        ContentType: fileType,
      });

      uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 1800 });
    } catch (err) {
      console.warn('S3 Presigned URL 생성 실패. Mock URL을 제공합니다.', err);
      uploadUrl = `http://localhost:3001/mock-s3-upload/${s3Key}`;
    }

    const fileVersion = await this.prisma.fileVersion.create({
      data: {
        deliverable_id: deliverableId,
        storage_path: `${process.env.R2_ENDPOINT}/${bucket}/${s3Key}`,
        preview_path: null,
        round_no: roundNo,
        is_final: false,
        uploaded_by: userId,
      },
    });

    await this.prisma.deliverable.update({
      where: { deliverable_id: deliverableId },
      data: {
        current_status: 'SUBMITTED',
      },
    });

    return {
      upload_url: uploadUrl,
      file_version: fileVersion,
    };
  }

  async getVersions(deliverableId: string) {
    const versions = await this.prisma.fileVersion.findMany({
      where: { deliverable_id: deliverableId },
      orderBy: { round_no: 'desc' },
      include: {
        uploader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    return versions;
  }
}
