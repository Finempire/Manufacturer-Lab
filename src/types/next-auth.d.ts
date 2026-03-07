import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            must_change_password?: boolean;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        must_change_password?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        must_change_password?: boolean;
    }
}
