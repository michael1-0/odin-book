declare global {
  namespace Express {
    interface User {
      id: number;
      githubId: string;
      username: string;
      noteToAll: string;
      createdAt: Date;
    }
  }
}

export {};
