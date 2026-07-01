import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';

/**
 * 🌐 LINGUA-ENG — Roles Guard (Phân quyền vai trò)
 * 
 * File này: Đọc metadata `@Roles(...)` được khai báo trên các routes/controllers
 * và kiểm tra xem vai trò của user có khớp với vai trò được yêu cầu hay không.
 * 
 * 💡 ADMIN BYPASS: Người dùng có vai trò ADMIN sẽ vượt qua tất cả các chốt chặn,
 * có thể thực hiện mọi chức năng mà không cần nằm trong mảng requiredRoles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu route không yêu cầu bất kỳ phân quyền role nào, cho phép đi qua
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Dữ liệu được đính kèm vào request bởi AuthGuard trước đó

    if (!user) {
      return false;
    }

    // 💡 Quy tắc đặc biệt: ADMIN có toàn quyền truy cập mọi chức năng
    if (user.role === 'ADMIN') {
      return true;
    }

    // Kiểm tra xem vai trò của người học hiện tại có nằm trong danh sách được cho phép
    return requiredRoles.includes(user.role);
  }
}
