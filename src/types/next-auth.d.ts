import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    branchId: string | null;
    branchName?: string;
    branchCity?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      branchId: string | null;
      branchName?: string;
      branchCity?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    branchId: string | null;
    branchName?: string;
    branchCity?: string;
  }
}
