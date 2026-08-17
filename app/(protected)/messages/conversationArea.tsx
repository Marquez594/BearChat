"use client";
import { ConversationsType } from "@/lib/types";
import {
  faArrowRight,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import React, { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { supabase } from "@/lib/supabase";

export default function ConversationArea() {
  const params = useSearchParams();
  const conversationID = params.get("conversationID");
  const [messageArea, setMessageArea] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");

  const queryClient = useQueryClient();

  const messageAreaRef = useRef<HTMLDivElement>(null);

  const getMessagesQuery = useQuery({
    queryKey: ["conversation", conversationID],
    enabled: !!conversationID,
    queryFn: async () => {
      const res = await fetch(
        `/api/messages/fetchConversation?conversationID=${encodeURIComponent(conversationID!)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      console.log(data);
      return data as ConversationsType;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/messages/sendMessage?conversationID=${encodeURIComponent(conversationID!)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: message }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      setMessage("");
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const sendNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate();
  };

  useEffect(() => {
    if (!conversationID) return;
    const channel = supabase
      .channel(`conversation-${conversationID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationID}`,
        },
        (payload) => {
          console.log("New message", payload.new);
          queryClient.setQueryData(
            ["conversation", conversationID],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                messages: [...old.messages, payload.new],
              };
            },
          );
        },
      )
      .subscribe((status) => {
        console.log("Realtime Status for messages", status);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationID]);

  const convertTime = (time: string) => {
    const date = new Date(time).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return date;
  };

  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() == today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() == yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [getMessagesQuery.data?.messages, sendMessageMutation.mutate]);

  return (
    <div
      className={`flex flex-col flex-2 bg-[#2d2f42e8] ${messageArea && conversationID ? "h-full" : "h-fit"} rounded-t-xl mt-auto`}
    >
      {conversationID && (
        <>
          <button
            className="bg-[#006241] shrink-0 py-2 px-4 w-full flex rounded-t-xl text-xl items-center hover:cursor-pointer"
            onClick={() => setMessageArea((prev) => !prev)}
          >
            <h1>{getMessagesQuery.data?.otherUser.username || "Loading"}</h1>
            <FontAwesomeIcon
              icon={messageArea ? faMinus : faPlus}
              className="ml-auto"
            ></FontAwesomeIcon>
          </button>
          {messageArea && (
            <div className="flex-1 min-h-0 text-black flex flex-col gap-5 ">
              <div
                className="flex-1 max-w-full overflow-y-scroll flex flex-col px-4 gap-6 items-center pt-2 "
                ref={messageAreaRef}
              >
                {getMessagesQuery.data?.messages.map((msg, index, messages) => {
                  const previous = messages[index - 1];
                  const showDayBreak =
                    !previous ||
                    new Date(previous.created_at).toDateString() !==
                      new Date(msg.created_at).toDateString();

                  return (
                    <>
                      {showDayBreak && (
                        <div className="w-full flex items-center justify-center border-b pb-2 border-white">
                          <h1 className="text-white">
                            {formatDay(msg.created_at)}
                          </h1>
                        </div>
                      )}
                      <div
                        key={msg.id}
                        className={`max-w-full md:max-w-3/4 min-w-0 ${msg.sender_id != getMessagesQuery.data.current_user ? "self-start" : "self-end"} flex gap-2`}
                      >
                        {msg.sender_id !=
                          getMessagesQuery.data.current_user && (
                          <div className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden">
                            <Image
                              src={getMessagesQuery.data.otherUser.pfp || Pfp}
                              alt="Profile Picture"
                              fill
                              className="object-cover"
                            ></Image>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 min-w-0 max-w-full">
                          <h1 className="text-white bg-[#686a76e8] px-4 py-1 rounded-md wrap-break-word">
                            {msg.content}
                          </h1>
                          <p
                            className={`text-xs text-gray-200 ${msg.sender_id == getMessagesQuery.data.current_user ? "self-end mr-1" : "self-start ml-1"}`}
                          >
                            {convertTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })}
              </div>
              <div className="shrink-0 p-2 w-full bg-[#161722e8] py-6">
                {/**Send Messages */}
                <form
                  className="border-white flex gap-6"
                  onSubmit={(e) => sendNewMessage(e)}
                >
                  <input
                    type="text"
                    className="w-full h-10 border-white border rounded-2xl text-white px-4"
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></input>
                  <button
                    className="bg-white h-10 w-10 rounded-full shrink-0 hover:cursor-pointer"
                    type="submit"
                  >
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      size="xl"
                    ></FontAwesomeIcon>
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
