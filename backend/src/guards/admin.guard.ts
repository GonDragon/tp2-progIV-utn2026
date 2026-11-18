import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const token = this.extractTokenFromHeader(context);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log(payload);

      if (payload.rol !== 'admin') {
        throw new UnauthorizedException();
      }

      context.switchToHttp().getRequest().user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  extractTokenFromHeader(context: ExecutionContext): string | null {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['Authorization']

    if (typeof authHeader === 'string') {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1].trim();
      }
      return authHeader.trim();
    }
    return null;
  }
}
