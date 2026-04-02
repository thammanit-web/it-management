"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { User, Lock, AlertCircle } from "lucide-react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false, // Handle redirect manually for better UX
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง / Incorrect username or password.");
        } else {
          setError("เกิดข้อผิดพลาดทางเทคนิค: " + result.error);
        }
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      console.error(err);
      setError("ระบบขัดข้องชั่วคราว โปรดลองใหม่ภายหลัง / System error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-none bg-transparent">
      <CardHeader className="space-y-1 text-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-[#0F1059] rounded-md flex items-center justify-center text-white font-normal text-2xl mx-auto">IT</div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-rose-600 text-sm font-normal border border-rose-100">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-normal text-black/80 uppercase tracking-wide px-1">Username</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-[#ADB5BD] group-focus-within:text-[#0F1059] transition-colors">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="รหัสพนักงาน / Employee ID"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-md border border-[#E9ECEF] bg-[#F8F9FA] py-2.5 pl-10 pr-4 outline-none focus:border-[#0F1059]/20 transition-all font-normal text-sm placeholder:text-[#ADB5BD]"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-normal text-black/80 uppercase tracking-wide px-1">Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-3 text-[#ADB5BD] group-focus-within:text-[#0F1059] transition-colors">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-md border border-[#E9ECEF] bg-[#F8F9FA] py-2.5 pl-10 pr-4 outline-none focus:border-[#0F1059]/20 transition-all font-normal text-sm placeholder:text-[#ADB5BD]"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full mt-4 bg-[#0F1059] text-white font-normal text-sm"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Login to System"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
