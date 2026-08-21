// 头像上传服务：走后端 multipart 上传 POST /api/upload，返回 CDN URL。
// 与 ImageUrlPicker 共用后端 5MB/张 限制。
import { upload } from '@client/src/api';

const MAX_AVATAR_SIZE: number = 5 * 1024 * 1024;

export async function uploadAvatarImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('图片大小不能超过 5MB');
  }
  const data = await upload([file]);
  if (!data.urls || data.urls.length === 0) {
    throw new Error('上传失败，请重试');
  }
  return data.urls[0];
}
