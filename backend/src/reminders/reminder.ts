export type ReminderRecord = {
  id: string;
  userId: string;
  chatId: string;
  text: string;
  dueAt: Date;
  sentAt: Date | null;
  createdAt: Date;
};
