import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * 🌐 LINGUA-ENG — Users Controller
 * 
 * File này: Định nghĩa các endpoints bảo mật để quản lý thông tin profile,
 * dashboard tiến trình và bảng xếp hạng học tập (Leaderboard).
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 🏆 GET: /users/leaderboard
   * Lấy bảng xếp hạng top 10 học viên có điểm kinh nghiệm (XP) cao nhất.
   * Đây là API công khai để kích thích tinh thần thi đua học tập.
   */
  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  /**
   * 👤 GET: /users/profile
   * Lấy thông tin tài khoản cá nhân của người học hiện tại
   */
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  /**
   * ✏️ PUT: /users/profile
   * Cập nhật thông tin tài khoản cá nhân
   */
  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  /**
   * 📊 GET: /users/dashboard
   * Lấy dữ liệu thống kê tiến trình học flashcard, bài tập và streak cho trang chủ
   */
  @Get('dashboard')
  @UseGuards(AuthGuard)
  async getDashboard(@CurrentUser('sub') userId: string) {
    return this.usersService.getDashboard(userId);
  }

  /**
   * 👥 GET: /users
   * Lấy danh sách toàn bộ người dùng trong hệ thống (Chỉ dành cho ADMIN)
   */
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  /**
   * 🔄 PUT: /users/:id/role
   * Thay đổi vai trò người dùng (Chỉ dành cho ADMIN)
   */
  @Put(':id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: string,
  ) {
    return this.usersService.updateUserRole(userId, role);
  }

  /**
   * ❌ DELETE: /users/:id
   * Xóa tài khoản người dùng (Chỉ dành cho ADMIN)
   */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Param('id') userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
