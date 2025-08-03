import { sendCrisisAlert } from "./sms";

export class NotificationService {
  static async sendCrisisAlert(userId: string, message: string) {
    return await sendCrisisAlert(userId, message);
  }
}
