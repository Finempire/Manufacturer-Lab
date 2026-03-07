import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      must_change_password: boolean;
      runner_status: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    must_change_password: boolean;
    runner_status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    must_change_password: boolean;
    runner_status: string;
  }
}
