"use client";

import { Button } from "@/components/ui/button";
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
    alert("ログインが必要です");
    router.push(`/auth/login?redirect=/agreements/${agreementId}`);
  }

  return (
    <Button variant={variant} onClick={handleClick}>
      {children}
    </Button>
  );
}
