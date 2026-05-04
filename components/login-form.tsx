"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn("microsoft-entra-id", { callbackUrl });
  };

  return (
    <Card className="w-full max-w-md border-none shadow-none bg-transparent">
      <CardHeader className="space-y-1 text-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-[#0F1059] rounded-md flex items-center justify-center text-white font-normal text-2xl mx-auto">IT</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-black/60 font-normal">
          ล็อกอินด้วยบัญชี NDC Microsoft 365
        </p>
        <Button
          size="lg"
          className="w-full bg-[#0F1059] text-white font-normal text-sm flex items-center gap-2"
          onClick={handleSignIn}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" className="h-4 w-4 shrink-0">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          {isLoading ? "Redirecting..." : "Sign in with Microsoft 365"}
        </Button>
      </CardContent>
    </Card>
  );
}
