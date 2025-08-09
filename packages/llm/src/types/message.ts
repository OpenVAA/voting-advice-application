import type { Role } from './role';

export class Message {
  role: Role;
  content: string;

  constructor({ role, content }: { role: Role; content: string }) {
    this.role = role;
    this.content = content;
  }
}
