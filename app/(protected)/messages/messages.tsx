"use client";
import { faMinus, faPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Pfp from "@/public/defaultpfp.jpg"

export default function MessagesArea() {
  const router = useRouter();
  const [messageArea, setMessageArea] = useState<boolean>(true);
  const conversationQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/getMyConversations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      console.log(data);
      return data;
    },
  });

  return (
    <div
      className={`flex flex-col flex-1 bg-[#ffffff] ${messageArea ? "h-full" : "h-fit"} rounded-t-xl mt-auto`}
    >
      <button
        className="bg-[#006241] py-2 px-4 w-full flex rounded-t-xl text-xl items-center hover:cursor-pointer"
        onClick={() => setMessageArea((prev) => !prev)}
      >
        <h1>Messages</h1>
        <FontAwesomeIcon
          icon={messageArea ? faMinus : faPlus}
          className="ml-auto"
        ></FontAwesomeIcon>
      </button>
      {messageArea && (
        <>
          <div className="flex-1 text-black p-2 flex flex-col gap-5  ">
            <form className="relative">
              <input
                className="w-full bg-gray-200 rounded-md p-2 pr-10"
                type="text"
                placeholder="Search"
              ></input>
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
              ></FontAwesomeIcon>
            </form>
          </div>
          <div className="border h-full overflow-y-auto w-full">
            {conversationQuery.data?.map((conversation: any) => (
              <button
                key={conversation.id}
                className="p-2 w-full border-b border-black flex gap-4 text-black hover:cursor-pointer"
                onClick={() =>
                  router.push(`/messages?conversationID=${conversation.id}`)
                }
              >
                <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={conversation.otherUser.pfp || Pfp}
                    alt=""
                    fill
                    className="object-cover"
                  ></Image>
                </div>
                <div className="w-full text-left">
                  <h1 className="font-bold font-sans">
                    {conversation.otherUser.username}
                  </h1>
                  <p className="text-sm truncate text-black max-w-64 ">
                    {conversation.last_message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
