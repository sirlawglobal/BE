import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to avoid throwing an error if no user is found
  handleRequest(err, user, info) {
    // If there's a user, return it; otherwise, return null instead of throwing
    return user || null;
  }
}
