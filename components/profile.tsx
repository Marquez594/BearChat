"use client";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { UserType } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import SignOutButton from "./logoutButton";
import { supabase } from "@/lib/supabase";

type ProfileAreaProps = {
  data: UserType;
};

export default function ProfileArea({ data }: ProfileAreaProps) {
  const [openDetails, setOpenDetails] = useState<boolean>(false);
  const [openProfileSettings, setOpenProfileSettings] =
    useState<boolean>(false);
  const [status, setStatus] = useState(data.status);
  const profileSetingsRef = useRef<HTMLDivElement>(null);

  const handleChangeStatus = async (
    newStatus: "Online" | "Away" | "Offline",
  ) => {
    if (newStatus == status) return;

    const { error } = await supabase
      .from("users")
      .update({ status: newStatus })
      .eq("uid", data.uid);
    if (error) {
      console.error(error?.message);
      return;
    }
    setStatus(newStatus);
  };

  useEffect(() => {
    function handleOutsideClicks(e: MouseEvent) {
      if (
        profileSetingsRef.current &&
        !profileSetingsRef.current.contains(e.target as Node)
      ) {
        setOpenProfileSettings(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClicks);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClicks);
    };
  }, []);
  return (
    <div className="border rounded-full relative" ref={profileSetingsRef}>
      <Image
        src={Pfp}
        alt="Pfp"
        className="rounded-full"
        onMouseEnter={() => {
          if (openProfileSettings) return;
          setOpenDetails(true);
        }}
        onMouseLeave={() => setOpenDetails(false)}
        onClick={() => {
          setOpenDetails(false);
          setOpenProfileSettings((prev) => !prev);
        }}
      ></Image>
      <div
        className={`w-3 h-3 absolute ${status == "Offline" ? "bg-gray-400" : status == "Online" ? "bg-green-500" : status == "Away" ? "bg-yellow-500" : null} rounded-full right-0 -bottom-1`}
      ></div>
      {openDetails && (
        <div className="w-fit absolute bottom-12 bg-[#1C2626] rounded-xl p-2 h-fit flex flex-col items-end gap-2">
          <h1>@{data.username}</h1>
          <div className="flex items-center gap-2 border-2 border-[#718a53] p-1 px-3 rounded-xl">
            <div
              className={`rounded-full h-2 w-2 ${status == "Offline" ? "bg-gray-400" : status == "Online" ? "bg-green-500" : status == "Away" ? "bg-yellow-500" : null}`}
            ></div>
            <h1>{status}</h1>
          </div>
        </div>
      )}
      {openProfileSettings && (
        <div
          className="w-64 absolute bottom-12 h-fit bg-[#1C2626] rounded-xl p-2 flex flex-col items-center gap-3"
          
        >
          <div className="flex items-center w-full">
            <div className="flex-1 flex items-center justify-center">
              <Image
                src={Pfp}
                alt="Pfp"
                width={80}
                height={80}
                className="rounded-full "
              ></Image>
            </div>
            <div className="flex-1 flex-col flex gap-2 *:hover:cursor-pointer">
              <button
                className={`flex items-center justify-center gap-2 border rounded-md ${status == "Online" ? "border-green-500" : "border-gray-600"}`}
                onClick={() => handleChangeStatus("Online")}
              >
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <h1>Online</h1>
              </button>
              <button
                className={`flex items-center justify-center gap-2 border rounded-md ${status == "Offline" ? "border-green-500" : "border-gray-600"}`}
                onClick={() => handleChangeStatus("Offline")}
              >
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <h1>Offline</h1>
              </button>
              <button
                className={`flex items-center justify-center gap-2 border rounded-md ${status == "Away" ? "border-green-500" : "border-gray-600"}`}
                onClick={() => handleChangeStatus("Away")}
              >
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <h1>Away</h1>
              </button>
            </div>
          </div>
          <SignOutButton
            className={
              "bg-red-600 text-black w-3/4 rounded-md hover:cursor-pointer font-bold"
            }
          ></SignOutButton>
        </div>
      )}
    </div>
  );
}
