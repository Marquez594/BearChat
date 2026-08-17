"use client";

import { UserType } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

const UserContext = createContext<UserType | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserType;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used inside provider");
  }
  return user;
}
