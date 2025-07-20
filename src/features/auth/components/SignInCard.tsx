"use client";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { loginSchema } from "@/features/auth/schemas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { useLogin } from "@/features/auth/api/use-login"; // Adjust the import path as necessary
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";



const SignInCard = () => {
  const { mutate } = useLogin(); // Assuming useLogin is defined in your auth client API
  const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof loginSchema>) => {
        mutate({
          json: values
        });
    };


  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none ">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-center text-2xl font-bold">Welcome Back✋</CardTitle>
      </CardHeader>
      <div className="px-7">
        <Separator/>
        <p className="text-center text-sm text-muted-foreground">
          Please sign in to continue using TaskPulse AI.
        </p>
      </div>
      <CardContent className="p-7">
        <Form {...form}>
        <form  onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField 
            name="email"
            control={form.control}
            rules={{ required: "Email is required" }}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Input 
                        {...field}
                        type="email"
                        placeholder="Email Address"
                />
                    </FormControl>
                    <FormMessage />
                
                </FormItem>
                )}
            />

            <FormField 
              name="password"
              control={form.control}
              rules={{ required: "Password is required" }}
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        {...field}
                        type={showPassword ? "text" : "password"}
                        min={8}
                        placeholder="Enter Password"
                        max={256}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

           

            
            <Button disabled={false} size="lg" className="w-full">Login</Button> 
        </form>
        </Form>
      </CardContent>

      <div className="px-7">
        <Separator /> 
      </div>

      <CardContent className="p-7 flex flex-col gap-y-4">
        <Button variant="secondary"  
        className="w-full"
        size="lg"
        disabled={false}>
        <FcGoogle className="mr-2" size={20} />
          Login with Google
        </Button>

        <Button variant="secondary"  
        className="w-full"
        size="lg"
        disabled={false}>
        <FaGithub className="mr-2" size={20} />
          Login with Github
        </Button>
      </CardContent>
        <div className="px-7">
            <Separator />   
        </div>
      <CardContent className="p-7 text-center"> 
        <p className="text-sm text-muted-foreground">
          Don&#39;t have an account?{" "}
          <a href="/sign-up" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
        </CardContent>
    </Card>
  )
}

export default SignInCard
