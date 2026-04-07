import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discussion } from './entities/discussion.entity';
import { Reply } from './entities/reply.entity';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectRepository(Discussion)
    private readonly discussionRepository: Repository<Discussion>,
    @InjectRepository(Reply)
    private readonly replyRepository: Repository<Reply>,
    private readonly coursesService: CoursesService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  private async validateParticipation(courseId: string | null, userId: number): Promise<void> {
    if (!courseId) return; // Global discussions are open
    
    try {
      const course = await this.coursesService.findOne(courseId);
      if (Number(course.instructorId) === Number(userId)) return; // Instructor allowed
      
      const enrollments = await this.enrollmentsService.getUserEnrollments(userId);
      const isEnrolled = enrollments.some(e => e.courseId === courseId);
      if (!isEnrolled) {
        throw new ForbiddenException('You must be enrolled in this course to participate in its discussions');
      }
    } catch (err) {
       if (err instanceof ForbiddenException) throw err;
       throw new ForbiddenException('Unable to verify course participation access');
    }
  }

  async createDiscussion(createDiscussionDto: CreateDiscussionDto, userId: number): Promise<Discussion> {
    await this.validateParticipation(createDiscussionDto.courseId || null, userId);

    const discussion = this.discussionRepository.create({
      ...createDiscussionDto,
      createdBy: userId,
    });
    return this.discussionRepository.save(discussion);
  }

  async getDiscussion(id: string, userId: number): Promise<Discussion> {
    const discussion = await this.discussionRepository.findOne({
      where: { id },
      relations: ['user', 'replies', 'replies.user'],
      order: {
        replies: {
          createdAt: 'ASC',
        },
      },
    });
    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    await this.validateParticipation(discussion.courseId, userId);

    return discussion;
  }

  async getAllDiscussions(courseId: string, userId: number): Promise<Discussion[]> {
    await this.validateParticipation(courseId, userId);
    
    return this.discussionRepository.find({
      where: { courseId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async createReply(createReplyDto: CreateReplyDto, userId: number): Promise<Reply> {
    const discussion = await this.getDiscussion(createReplyDto.discussionId, userId);
    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    await this.validateParticipation(discussion.courseId, userId);

    const reply = this.replyRepository.create({
      ...createReplyDto,
      userId,
    });
    
    const savedReply = await this.replyRepository.save(reply);
    const result = await this.replyRepository.findOne({
      where: { id: savedReply.id },
      relations: ['user'],
    });
    if (!result) throw new Error('Failed to retrieve saved reply');
    return result;
  }
}