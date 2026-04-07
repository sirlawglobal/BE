import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a lesson inside a module (Instructor/Admin)' })
  @ApiQuery({ name: 'moduleId', required: true, type: String })
  create(@Body() createLessonDto: CreateLessonDto, @Query('moduleId') moduleId: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.lessonsService.create(createLessonDto, moduleId, user.id, isAdmin);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find all lessons for a module (Restricted to enrolled)' })
  @ApiQuery({ name: 'moduleId', required: true, type: String })
  findAll(@Query('moduleId') moduleId: string, @CurrentUser() user: any) {
    return this.lessonsService.findAllByModule(moduleId, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson content by ID (Restricted to enrolled)' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lessonsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson details' })
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.lessonsService.update(id, updateLessonDto, user.id, isAdmin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a lesson' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.lessonsService.remove(id, user.id, isAdmin);
  }
}
