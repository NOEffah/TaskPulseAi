import { Hono } from "hono";
import { validator } from "hono/validator";
import { loginSchema } from "../schemas";
import { signupSchema } from "../schemas";
import { createAdminClient } from "@/lib/appwrite";
import { ID } from "node-appwrite";
import { setCookie, deleteCookie } from "hono/cookie";
import { AUTH_COOKIE_NAME } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";

const app = new Hono()
.get(
  "/current",
  sessionMiddleware,
  async (c) => {
    const user = c.get("user");

    return c.json({ data: user });
  })

.post(
  "/login",
  validator("json", (value, c) => {
    const parsed = loginSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ errors: parsed.error.flatten() }, 400);
    }
    return parsed.data;
  }),
   async(c) => {
    const { email, password} = c.req.valid("json");
    
    const { account } = await createAdminClient();

    const session = await account.createEmailPasswordSession(
      email,
      password
    );

     setCookie(c, AUTH_COOKIE_NAME, session.secret, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",  
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return c.json({ success: true });
  })

  .post(
  "/signup",  
  validator("json", (value, c) => {
    const parsed = signupSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ errors: parsed.error.flatten() }, 400);
    }
    return parsed.data;
  })
  , async (c) => {
    const { name, email, password } = c.req.valid("json");
    

    const { account } = await createAdminClient();

    await account.create(
      ID.unique(),  
      email,
      password,
      name
    );

    const session = await account.createEmailPasswordSession(
      email,
      password
    );

    setCookie(c, AUTH_COOKIE_NAME, session.secret, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",  
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return c.json({ success: true });
  })

  .post("/logout",sessionMiddleware, async (c) => {
    const account = c.get("account");

    deleteCookie(c, AUTH_COOKIE_NAME);
    await account.deleteSession("current");

    return c.json({ success: true });
  }
);


export default app;
