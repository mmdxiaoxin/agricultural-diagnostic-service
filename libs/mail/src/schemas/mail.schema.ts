import { z } from 'zod';

export const mailConfigSchema = z
  .object({
    host: z.string().min(1, '邮件服务器地址不能为空'),
    port: z.number().int().positive('邮件服务器端口必须为正整数'),
    secure: z.boolean(),
    auth: z.object({
      user: z.string().email('邮箱格式不正确').min(1, '邮箱账号不能为空'),
      pass: z.string().min(1, '邮箱密码不能为空'),
    }),
    from: z.string().min(1, '发件人不能为空'),
  })
  .strict();

export type MailConfig = z.infer<typeof mailConfigSchema>;
