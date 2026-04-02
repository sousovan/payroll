import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-compatible auth using shared config (no DB imports)
export const { auth } = NextAuth(authConfig);
