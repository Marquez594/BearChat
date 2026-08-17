"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faMinus,
  faPhone,
  faPlus,
  faUserPlus,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import { SearchUserType } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function DisplayUser() {
  const router = useRouter();
  const searchParam = useSearchParams();
  const query = searchParam.get("User");
  const [displayArea, setDisplayArea] = useState<boolean>(true);
  const [userData, setUserData] = useState<SearchUserType>();

  const conversationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/messages/createConversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user2: userData?.uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error);
      }
      return data;
    },
    onSuccess: (data) => {
      router.push(`/messages?conversationID=${data.conversationID}`);
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/friendRequest", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ receiverID: userData?.uid }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      console.log("Friend request sent");
    },

    onError: (error) => {
      console.log(error.message);
    },
  });

  const {
    data: friendStatus,
    isLoading: friendStatusLoading,
    error: friendStatusError,
  } = useQuery({
    queryKey: ["friendStatus", userData?.uid],
    enabled: !!userData?.uid,
    queryFn: async () => {
      const res = await fetch("/api/users/checkFriends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          friendID: userData!.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data as { isFriend: boolean };
    },
  });

  const fetchUserData = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("uid,username,pfp,status")
      .eq("uid", query)
      .single();
    if (error) {
      console.log(error?.message);
    } else {
      setUserData(data);
    }
  };

  useEffect(() => {
    if (query) {
      fetchUserData();
    }
  }, [query]);

  return (
    <div
      className={`flex-3 mt-auto flex flex-col rounded-t-xl ${displayArea && query ? "h-full" : "h-fit"} bg-[#2d2f42e8] font-sans`}
    >
      {query && (
        <>
          <button
            className="bg-[#006241] py-2 px-4 w-full flex rounded-t-xl text-xl items-center hover:cursor-pointer"
            onClick={() => setDisplayArea((prev) => !prev)}
          >
            <h1>{userData?.username}</h1>
            {displayArea ? (
              <FontAwesomeIcon
                icon={faMinus}
                className="ml-auto text-sm"
              ></FontAwesomeIcon>
            ) : (
              <FontAwesomeIcon
                icon={faPlus}
                className="ml-auto text-sm"
              ></FontAwesomeIcon>
            )}
          </button>
          {displayArea && (
            <div className=" flex-1 flex justify-center items-center">
              <div className="flex justify-center items-center flex-col gap-2">
                <div className="relative h-58 w-58">
                  <Image
                    src={userData?.pfp || Pfp}
                    alt={`${userData?.username}'s profile picture`}
                    fill
                    className="rounded-full object-cover"
                  ></Image>
                </div>
                <h1 className="text-4xl font-sans">@{userData?.username}</h1>
                <div className="w-full flex gap-8 h-fit mt-8">
                  {!friendStatus?.isFriend && (
                    <div className="flex-1">
                      {/**Request */}
                      <button
                        className="w-20 h-20 border-white border rounded-full hover:cursor-pointer"
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                      >
                        <FontAwesomeIcon
                          icon={faUserPlus}
                          size="lg"
                        ></FontAwesomeIcon>
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    {/**Message */}
                    <button
                      className="w-20 h-20 border-white border rounded-full hover:cursor-pointer"
                      onClick={() => conversationMutation.mutate()}
                    >
                      <FontAwesomeIcon
                        icon={faMessage}
                        size="lg"
                      ></FontAwesomeIcon>
                    </button>
                  </div>
                  {friendStatus?.isFriend && (
                    <>
                      <div className="flex-1">
                        {/**Message */}
                        <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
                          <FontAwesomeIcon
                            icon={faPhone}
                            size="lg"
                          ></FontAwesomeIcon>
                        </button>
                      </div>
                      <div className="flex-1">
                        {/**Message */}
                        <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
                          <FontAwesomeIcon
                            icon={faVideo}
                            size="lg"
                          ></FontAwesomeIcon>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
