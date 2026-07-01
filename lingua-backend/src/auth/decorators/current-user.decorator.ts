import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 🌐 LINGUA-ENG — Custom Parameter Decorator: CurrentUser
 * 
 * File này: Giúp trích xuất nhanh thông tin User đang đăng nhập từ đối tượng Request.
 * 
 * 💡 So sánh với Spring Boot (Javi):
 * - Tương đương với `@AuthenticationPrincipal` trong Spring Security.
 * - Thay vì phải viết `@Req() req: Request` rồi lấy `req['user']` thủ công ở các controller,
 *   bạn chỉ cần viết `@CurrentUser() user: any` là có ngay thông tin user cực kỳ ngắn gọn.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Trả về trường cụ thể nếu có truyền đối số (ví dụ: @CurrentUser('sub') sẽ trả về id)
    return data ? user?.[data] : user;
  },
);
