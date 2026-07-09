"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type LoginType = {
  username: string;
  password: string;
};

async function loginUser(data: LoginType) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    return new Error(err.error || "Bad");
  }
  return res.json();
}

export default function LoginForm() {
  const [loginForm, setLoginForm] = useState<LoginType>({
    username: "",
    password: "",
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: () => router.push("/"),
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(loginForm);
  };

  return (
    <form
      className="bg-[#394130] w-1/4 h-1/2 rounded-xl py-10 p-2 flex flex-col items-center gap-5"
      onSubmit={handleFormSubmit}
    >
      <h1 className=" text-2xl font-bold font-mono">Login</h1>
      <div className="flex flex-col justify-center items-center w-4/5 gap-8">
        <div className="flex border-b border-black w-full pb-2 items-center gap-2">
          <input
            placeholder="Username"
            name="username"
            className="w-full"
            onChange={(e) => handleFormChange(e)}
          ></input>
          <FontAwesomeIcon icon={faEnvelope}></FontAwesomeIcon>
        </div>
        <div className="flex border-b border-black w-full pb-2 items-center gap-2">
          <input
            placeholder="Password"
            className="w-full"
            type="password"
            name="password"
            onChange={(e) => handleFormChange(e)}
          ></input>
          <FontAwesomeIcon icon={faLock}></FontAwesomeIcon>
        </div>
        <button
          className="text-white py-2 w-4/5 bg-[#524a31] rounded-xl hover:cursor-pointer"
          type="submit"
        >
          Login
        </button>
      </div>

      <h2 className="text-sm">
        Don't have an account?{" "}
        <Link href="/signup" className="underline">
          Create One
        </Link>
      </h2>
    </form>
  );
}
