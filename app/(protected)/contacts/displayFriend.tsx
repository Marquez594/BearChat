"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SearchUserType } from "@/lib/types";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { faMessage, faPhone, faVideo } from "@fortawesome/free-solid-svg-icons";
export default function DisplayFriend() {
  const searchParam = useSearchParams();
  const router = useRouter();
  const [displayArea, setDisplayArea] = useState<boolean>(true);
  const query = searchParam.get("friend");

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", query],
    enabled: !!query,
    queryFn: async () => {
      const res = await fetch(
        `/api/users/getUser?friend=${encodeURIComponent(query!)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data as SearchUserType;
    },
  });

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

  const callMutation = useMutation({
    mutationFn: async ({
      receiverID,
      type,
    }: {
      receiverID: string;
      type: "audio" | "video";
    }) => {
      const res = await fetch("/api/calls/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverID,
          type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return { data, type, receiverID };
    },
    onError: (error) => {
      console.log(error.message);
    },
    onSuccess: ({ data, type, receiverID }) => {
      router.push(
        `/calls?callID=${data.id}}&role=caller&type=${type}&uid=${receiverID}`,
      );
      console.log(data);
    },
  });

  return (
    <div
      className={`flex-2 mt-auto flex flex-col rounded-t-xl ${displayArea && query ? "h-full" : "h-fit"} bg-[#2d2f42e8] font-sans`}
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
                <div
                  className="relative h-38 w-38 md:h-56 md:w-56"
                >
                  <Image
                    src={userData?.pfp || Pfp}
                    alt={`${userData?.username}'s profile picture`}
                    fill
                    className="rounded-full object-cover"
                  ></Image>
                </div>
                <h1 className="text-2xl md:text-4xl font-sans">@{userData?.username}</h1>
                <div className="w-full flex gap-8 h-fit mt-8">
                  <div className="flex-1">
                    {/**Message */}
                    <button
                      className="w-15 h-15 md:w-20 md:h-20 border-white border rounded-full hover:cursor-pointer"
                      onClick={() => conversationMutation.mutate()}
                    >
                      <FontAwesomeIcon
                        icon={faMessage}
                        size="lg"
                      ></FontAwesomeIcon>
                    </button>
                  </div>

                  <div className="flex-1">
                    {/**Message */}
                    <button
                      className="w-15 h-15 md:w-20 md:h-20 border-white border rounded-full hover:cursor-pointer"
                      onClick={() =>
                        callMutation.mutate({
                          receiverID: userData?.uid!,
                          type: "audio",
                        })
                      }
                    >
                      <FontAwesomeIcon
                        icon={faPhone}
                        size="lg"
                      ></FontAwesomeIcon>
                    </button>
                  </div>
                  <div className="flex-1">
                    {/**Video */}
                    <button
                      className="w-15 h-15 md:w-20 md:h-20 border-white border rounded-full hover:cursor-pointer"
                      onClick={() =>
                        callMutation.mutate({
                          receiverID: userData?.uid!,
                          type: "video",
                        })
                      }
                    >
                      <FontAwesomeIcon
                        icon={faVideo}
                        size="lg"
                      ></FontAwesomeIcon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
