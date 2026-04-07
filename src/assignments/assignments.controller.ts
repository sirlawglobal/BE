import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new assignment' })
  create(@Body() createAssignmentDto: CreateAssignmentDto, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.assignmentsService.create(createAssignmentDto, user.id, isAdmin);
  }

  @Get('course/:courseId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all assignments for a course (Restricted to enrolled)' })
  findByCourse(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.assignmentsService.findByCourse(courseId, user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an assignment by ID' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an assignment' })
  update(@Param('id') id: string, @Body() updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an assignment' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}