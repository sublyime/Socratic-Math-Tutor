
export enum Role {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  image?: string; // base64 data URL for display
}
