"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type SignOutButtonType = {
  className: string;
};

async function logoutUser() {
  const res = await fetch("/api/logout", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error);
  }
  return data;
}

export default function SignOutButton({ className = "" }: SignOutButtonType) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });
  return (
    <button onClick={() => mutation.mutate()} className={className}>
      {mutation.isPending ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
