"use client"
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import  Link  from "next/link";

import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/features/auth/schemas"; // Adjust the import path as necessary
import { useSignUp } from "../api/use-signup";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";





const SignUpCard = () => {
  const { mutate } = useSignUp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "", 
        },
    });

    const onSubmit = (values: z.infer<typeof signupSchema>) => {
        console.log("Form submitted with values:", values);
        // Handle form submission logic here, e.g., API call for sign-up
        mutate({
          json: values
        });
    }

  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none ">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-center text-2xl font-bold">Get Started Here 💨</CardTitle>
        <CardDescription>By signing Up you agree to our {" "}
            <Link href="/privacy" className="text-blue-500 hover:underline">
            <span>Privacy Policy </span>
            </Link>
            &
            <Link href="/terms" className="text-blue-500 hover:underline">
            <span> Terms of Service</span>
            </Link>
        </CardDescription>
      </CardHeader>
      
      <div className="px-7">
        <Separator/>
      </div>
      <CardContent className="p-7">
        <Form 
        {...form}
        >
        <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4">
            <FormField 
            name="name"
            control={form.control}
            rules={{ required: "Name is required" }}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <Input 
                        {...field}
                        type="text"
                        placeholder="Enter your Name"
                />
                    </FormControl>
                    <FormMessage />
                
                </FormItem>
                )}
            />

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
                        placeholder="Enter Email Address"
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
                        placeholder="Enter a Password"
                        min={8}
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

            <FormField 
                name="confirmPassword"
                control={form.control}
                rules={{ required: "Please confirm your password" }}
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your Password"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />


            <Button disabled={false} size="lg" className="w-full">Register</Button> 
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
      <div>
        <Separator />
        </div>   
    <CardContent className="p-7 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-500 hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
    </Card>
  )
}

export default SignUpCard
