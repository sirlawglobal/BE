import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Otp, OtpType } from './entities/otp.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto, ResendOtpDto } from './dto/otp.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { UsersService } from '../users/users.service';
import { OutboxService } from '../outbox/outbox.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Otp)
    private otpRepo: Repository<Otp>,
    private jwtService: JwtService,
    private usersService: UsersService,
    private dataSource: DataSource,
    private outboxService: OutboxService,
  ) { }

  async register(dto: RegisterDto) {
    const { firstName, lastName, email, password, role } = dto;

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Using Transactional Outbox Pattern
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const user = manager.create(User, {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
      });

      await manager.save(user);

      // Generate and save OTP & Outbox event atomically
      await this.generateAndSendOtp(user.email, OtpType.EMAIL_VERIFY, manager);
    });

    return {
      message: 'Registration successful. Please check your email for the verification code.',
      email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, code } = dto;

    const otp = await this.otpRepo.findOne({
      where: { email, code, type: OtpType.EMAIL_VERIFY },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid verification code');
    }

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Verification code has expired');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isVerified = true;
    await this.userRepo.save(user);

    // Delete all OTPs for this email after successful verification
    await this.otpRepo.delete({ email, type: OtpType.EMAIL_VERIFY });

    const payload: JwtPayload = { id: user.id, sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const { email } = dto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await this.generateAndSendOtp(email, OtpType.EMAIL_VERIFY, manager);
    });

    return {
      message: 'A new verification code has been sent to your email.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;
    const user = await this.usersService.findByEmail(email);

    // Always return the same response to prevent email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset code has been sent.' };
    }

    await this.dataSource.transaction(async (manager: EntityManager) => {
      // Invalidate any existing password reset OTPs
      await manager.delete(Otp, { email, type: OtpType.PASSWORD_RESET });
      await this.generateAndSendOtp(email, OtpType.PASSWORD_RESET, manager);
    });

    return { message: 'If an account with that email exists, a reset code has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, code, newPassword } = dto;

    const otp = await this.otpRepo.findOne({
      where: { email, code, type: OtpType.PASSWORD_RESET },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Reset code has expired. Please request a new one.');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepo.save(user);

    // Invalidate the used OTP
    await this.otpRepo.delete({ email, type: OtpType.PASSWORD_RESET });

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  private async generateAndSendOtp(email: string, type: OtpType, manager?: EntityManager) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const otpRepo = manager ? manager.getRepository(Otp) : this.otpRepo;

    const otp = otpRepo.create({ email, code, type, expiresAt });
    await otpRepo.save(otp);

    const outboxType = type === OtpType.PASSWORD_RESET ? 'PASSWORD_RESET_EMAIL' : 'OTP_EMAIL';
    await this.outboxService.add(outboxType, { email, code }, manager);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account has been deactivated');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email address before logging in');
    }

    const isMatched = await bcrypt.compare(dto.password, user.password);
    if (!isMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { id: user.id, sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    };
  }

  async getMe(id: number) {
    try {
      return await this.usersService.findById(id);
    } catch (error) {
      throw new NotFoundException('User profile not found');
    }
  }
}
