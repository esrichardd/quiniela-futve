import { auth } from "@/server/auth/server";

export const { DELETE, GET, PATCH, POST, PUT } = auth.handler();
