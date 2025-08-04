export const dynamic = 'force-dynamic';
import SignUpCard from "@/features/auth/components/SignUpCard";

import { getCurrentUser } from "@/features/auth/queries";
import { redirect } from "next/navigation";

const SignUpPage = async () => {
  const user = await getCurrentUser();
  
  if (user) redirect("/");

  return <SignUpCard />;

}

export default SignUpPage;
