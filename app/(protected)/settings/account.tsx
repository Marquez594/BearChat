"use client";

import { useUser } from "@/components/userContext";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export default function Account() {
  const user = useUser();
  const [username, setUsername] = useState<string>("");
  const [passwordChanges, setPasswordChanges] = useState<{
    currentPassword: string;
    newPassword: string;
  }>({
    currentPassword: "",
    newPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordChanges((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/changePassword", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify(passwordChanges),
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.error);
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      setPasswordChanges({
        currentPassword: "",
        newPassword: "",
      });
    },
  });

  const changeMutation = useMutation({
    mutationFn: async () => {
      if (username.length == 0) return;
      const res = await fetch("/api/users/changeUsername", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newUsername: username,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.error);
        throw new Error(data.error);
      }
      return data;
    },
  });

  return (
    <>
      <h1 className="text-3xl border-b pl-2">Account</h1>
      <div className=" h-full p-2 flex flex-col gap-5 overflow-y-scroll">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl">Change Username</h1>
          <div className="flex gap-5">
            <div className="flex-1 flex flex-col gap-1">
              <p>Old Username</p>
              <input
                className="bg-black  text-center py-2 rounded-md"
                value={user.username}
                disabled
              ></input>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>New Username</p>
              <input
                className="bg-black text-center py-2 rounded-md"
                onChange={(e) => setUsername(e.target.value)}
              ></input>
            </div>
            <div className="flex-1 flex justify-end flex-col items-end mb-1">
              <button
                className="w-2/3 md:w-1/2 bg-gray-400 p-1  rounded-md text-black hover:cursor-pointer"
                onClick={() => changeMutation.mutate()}
              >
                Change
              </button>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4">
          <div>
            <h1 className="text-2xl">Change Password</h1>
            <p className="text-xs">
              New Password must be at least 6 characters
            </p>
          </div>
          <div className="flex gap-5">
            <div className="flex-1 flex flex-col gap-1">
              <p>Type Current Password</p>
              <input
                className="bg-black  text-center py-2 rounded-md"
                name="currentPassword"
                value={passwordChanges.currentPassword}
                onChange={(e) => handleChange(e)}
              ></input>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Type New Password</p>
              <input
                className="bg-black text-center py-2 rounded-md"
                name="newPassword"
                value={passwordChanges.newPassword}
                onChange={(e) => handleChange(e)}
              ></input>
            </div>
            <div className="flex-1 flex items-end flex-col  justify-end mb-1">
              <button
                className="w-2/3 md:w-1/2 p-1 rounded-md bg-gray-400 hover:cursor-pointer"
                onClick={() => passwordMutation.mutate()}
              >
                <h1 className="text-black">Change</h1>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
