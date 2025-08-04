export const dynamic = 'force-dynamic';

import SignInCard from "@/features/auth/components/SignInCard";

import { getCurrentUser } from "@/features/auth/queries";
import { redirect } from "next/navigation";

const SignInPage = async () => {
  const user = await getCurrentUser();
  
  if (user) redirect("/");

  return <SignInCard />;

}

export default SignInPage;
