"use client";

import { Button } from "@/components/ui/button";
import { pushReturnUrl } from "@/lib/return-stack";
import { useRouter } from "next/navigation";

type Props = {
  agreementId: string;
  variant?: "default" | "outline" | "destructive";
  children: React.ReactNode;
};

export function LoginRequiredButton({
  agreementId,
  variant = "default",
  children,
}: Props) {
  const router = useRouter();

  function handleClick() {
    pushReturnUrl(`/agreements/${agreementId}`);
    router.push("/auth/login");
  }

  return (
    <Button variant={variant} onClick={handleClick}>
      {children}
    </Button>
  );
}
