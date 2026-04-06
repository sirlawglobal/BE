import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationService } from './collaboration.service';
import { CollaborationController } from './collaboration.controller';
import { Discussion } from './entities/discussion.entity';
import { Reply } from './entities/reply.entity';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Discussion, Reply]),
    CoursesModule,
    EnrollmentsModule,
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService],
})
export class CollaborationModule {}