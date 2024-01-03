export { default } from "next-auth/middleware";

export const config = {
    matcher: ["/((?!api|login_state|maps).*)"],
};