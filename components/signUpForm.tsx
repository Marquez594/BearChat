"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type SignUpType = {
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  confirmPassword: string;
};

async function signUpUsers(signUpForm: SignUpType) {
  const res = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signUpForm),
  });
  if (!res.ok) {
    throw new Error("Failed to create user");
  }
  return res.json();
}

export default function SignUpForm() {
  const router = useRouter();
  const [signUpForm, setSignUpForm] = useState<SignUpType>({
    firstname: "",
    lastname: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [confirmPasswordError, setConfirmPasswordError] =
    useState<boolean>(false);

  const mutation = useMutation({
    mutationFn: signUpUsers,
    onSuccess: () => {
      router.push("login");
    },
  });

  const handleFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name == "firstname" || name == "lastname") {
      value = value.replace(/[^a-zA-Z '-]/g, "");
    }
    if (name == "password" || name == "confirmPassword") {
      value = value.replace(/\s/g, "");
    }
    setSignUpForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(signUpForm);
  };

  return (
    <form
      className="flex flex-col justify-center items-center gap-4 w-4/5 "
      onSubmit={handleFormSubmit}
    >
      {confirmPasswordError || mutation.error ? (
        <div className="fixed w-1/2 h-fit p-2 bg-[#5a5136] rounded-bl-xl rounded-br-xl top-0 flex flex-col justify-center items-center">
          {confirmPasswordError && (
            <h1 className="text-[#1c2626] font-bold">Passwords do not match</h1>
          )}

          {mutation.error && (
            <h1 className="text-[#1c2626] font-bold">
              {(mutation.error as Error)?.message}
            </h1>
          )}
        </div>
      ) : null}

      <input
        placeholder="Firstname"
        onChange={(e) => handleFormData(e)}
        value={signUpForm.firstname}
        name="firstname"
        className="p-2 w-full  border-b-2 border-[#1c2626]"
      ></input>
      <input
        placeholder="Lastname"
        name="lastname"
        onChange={(e) => handleFormData(e)}
        value={signUpForm.lastname}
        className="p-2 w-full border-b-2 border-[#1c2626]"
      ></input>
      <input
        placeholder="Username"
        onChange={(e) => handleFormData(e)}
        value={signUpForm.username}
        name="username"
        className="p-2 w-full border-b-2 border-[#1c2626]"
      ></input>
      <input
        placeholder="Password"
        onChange={(e) => handleFormData(e)}
        value={signUpForm.password}
        name="password"
        type="password"
        className="p-2 w-full border-b-2 border-[#1c2626]"
      ></input>
      <input
        placeholder="Confirm Password"
        className={`p-2 w-full ${confirmPasswordError ? "border border-red-500 rounded-xl" : "border-b-2 border-[#1c2626]"} `}
        onChange={(e) => handleFormData(e)}
        value={signUpForm.confirmPassword}
        onBlur={(e) => {
          if (
            signUpForm.confirmPassword != "" &&
            signUpForm.confirmPassword != signUpForm.password
          ) {
            setConfirmPasswordError(true);
          } else if (
            signUpForm.confirmPassword != "" &&
            signUpForm.confirmPassword == signUpForm.password
          ) {
            setConfirmPasswordError(false);
          } else {
            setConfirmPasswordError(false);
          }
        }}
        name="confirmPassword"
        type="password"
      ></input>
      <button
        className="bg-[#524a31] p-2 w-full rounded-xl hover:cursor-pointer"
        disabled={mutation.isPending}
      >
        {!mutation.isPending ? "Create" : "Creating"}
      </button>
    </form>
  );
}
