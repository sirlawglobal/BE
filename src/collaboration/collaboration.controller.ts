import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Collaboration')
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('discussions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discussion thread' })
  createDiscussion(
    @Body() createDiscussionDto: CreateDiscussionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.collaborationService.createDiscussion(createDiscussionDto, user.sub);
  }

  @Get('discussions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a discussion thread by ID' })
  getDiscussion(@Param('id') id: string) {
    return this.collaborationService.getDiscussion(id);
  }

  @Get('discussions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discussion threads (optional course filter)' })
  getAllDiscussions(@Query('courseId') courseId?: string) {
    return this.collaborationService.getAllDiscussions(courseId);
  }

  @Post('replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a reply to a discussion' })
  createReply(
    @Body() createReplyDto: CreateReplyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.collaborationService.createReply(createReplyDto, user.sub);
  }
}