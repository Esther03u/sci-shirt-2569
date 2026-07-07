import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  registrationCode: z.string().min(1, 'กรุณากรอกรหัสลับ'),
});

export const DistributePostSchema = z.object({
  sheetRowId: z.union([z.string(), z.number()]).transform(String),
  phone: z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์'),
});

export const DistributeDeleteSchema = z.object({
  distributionId: z.string().uuid('รูปแบบ ID ไม่ถูกต้อง'),
});

export const AdminSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});
