import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    private readonly coursesService: CoursesService,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto, userId: number, isAdmin: boolean): Promise<Assignment> {
    const course = await this.coursesService.findOne(createAssignmentDto.courseId);
    if (Number(course.instructorId) !== Number(userId) && !isAdmin) {
      throw new UnauthorizedException('You can only add assignments to your own courses');
    }
    const assignment = this.assignmentRepository.create(createAssignmentDto);
    return this.assignmentRepository.save(assignment);
  }

  async findByCourse(courseId: string, userId?: number): Promise<Assignment[]> {
    const isAuthorized = await this.coursesService.hasAccess(courseId, userId);
    
    if (!isAuthorized) {
      return [];
    }
    
    return this.assignmentRepository.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    const assignment = await this.findOne(id);
    Object.assign(assignment, updateAssignmentDto);
    return this.assignmentRepository.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
  }
}