"use client";

import { IncomingFriendRequestType, PendingRequestType } from "@/lib/types";
import {
  faCheck,
  faMinus,
  faPlus,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";

export default function FriendRequestArea() {
  const [friendRequestArea, setFriendRequestArea] = useState<boolean>(true);
  const [viewOptions, setViewOptions] = useState<"Requests" | "Pending">(
    "Requests",
  );

  const queryClinet = useQueryClient();

  const {
    data: incomingRequest = [],
    isLoading: incomingLoading,
    error: incomingError,
  } = useQuery({
    queryKey: ["incomingRequest"],
    queryFn: async () => {
      const res = await fetch("/api/users/fetchFriendRequest", {
        method: "GET",
        headers: {
          "Content-Type": "Application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data as IncomingFriendRequestType[];
    },
  });

  const {
    data: pendingRequest = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pendingRequest"],
    queryFn: async () => {
      const res = await fetch("/api/users/pendingRequest", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data as PendingRequestType[];
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (friendID: string) => {
      const res = await fetch("/api/users/friendAccept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendID }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({
        queryKey: ["incomingRequest"],
      });
      queryClinet.invalidateQueries({
        queryKey: ["friendRequest"],
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const pendingCancelMutation = useMutation({
    mutationFn: async (pendingID: string) => {
      const res = await fetch("/api/users/cancelPendingRequest", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pendingID }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({
        queryKey: ["pendingRequest"],
      });
    },
  });

  const incomingCancelMuation = useMutation({
    mutationFn: async (friendID: string) => {
      const res = await fetch("/api/users/incomingRequestReject", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendID }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data;
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({
        queryKey: ["incomingRequest"],
      });
    },
  });

  return (
    <div
      className={`flex-1 flex flex-col bg-white ${friendRequestArea ? "h-full" : "h-fit"} mt-auto rounded-t-xl `}
    >
      <button
        className="bg-[#006241] rounded-t-xl hover:cursor-pointer py-2 px-4 text-xl flex items-center"
        onClick={() => setFriendRequestArea((prev) => !prev)}
      >
        <h1>{viewOptions}</h1>
        <FontAwesomeIcon
          icon={friendRequestArea ? faMinus : faPlus}
          className="ml-auto text-sm"
        ></FontAwesomeIcon>
      </button>
      {friendRequestArea && (
        <div className="flex-1 text-black p-2 flex flex-col gap-5">
          <div className=" flex gap-4 *:hover:cursor-pointer">
            {/**Options to change to requests or pending */}
            <button
              className={`flex-1 relative py-1 border-b-2 ${viewOptions == "Requests" ? " border-[#2d2f42e8]" : "border-transparent"}`}
              onClick={() => setViewOptions("Requests")}
            >
              <h1>Requests</h1>
              {incomingRequest.length > 0 && (
                <h1 className="absolute left-3/5 text-white font-mono -top-1 min-w-5 h-5 px-1.5 text-sm rounded-full bg-red-500 flex items-center justify-center ">
                  {incomingRequest.length}
                </h1>
              )}
            </button>
            <button
              className={`flex-1 py-1 relative  border-b-2 ${viewOptions == "Pending" ? " border-[#2d2f42e8]" : "border-transparent"}`}
              onClick={() => setViewOptions("Pending")}
            >
              <h1>Pending</h1>
              {pendingRequest.length > 0 && (
                <h1 className="absolute left-3/5 text-white font-mono -top-1 min-w-5 h-5 px-1.5 text-sm rounded-full bg-red-500 flex items-center justify-center ">
                  {pendingRequest.length}
                </h1>
              )}
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-scroll">
            {viewOptions == "Pending" && (
              <>
                {pendingRequest.map((req) => (
                  <div
                    key={req.id}
                    className="border-b border-b-gray-400 px-2 py-2 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full relative">
                      <Image
                        src={req.receiver.pfp || Pfp}
                        alt={`${req.receiver.username}'s profile picture`}
                        fill
                        className="rounded-full"
                      ></Image>
                    </div>
                    <h1>{req.receiver.username}</h1>
                    <button
                      className="ml-auto hover:cursor-pointer"
                      onClick={() =>
                        pendingCancelMutation.mutate(req.receiver.uid)
                      }
                      disabled={pendingCancelMutation.isPending}
                    >
                      <FontAwesomeIcon icon={faX}></FontAwesomeIcon>
                    </button>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center justify-center">
                    <h1>Loading...</h1>
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center">
                    <h1>{error.message}</h1>
                  </div>
                )}
                {!isLoading && pendingRequest.length == 0 && (
                  <div className=" border-black flex h-full items-center justify-center">
                    <h1 className="text-gray-500">
                      No incoming friend requests sent
                    </h1>
                  </div>
                )}
              </>
            )}
            {viewOptions == "Requests" && (
              <>
                {incomingRequest.map((req) => (
                  <div
                    className="border-b border-b-gray-400 px-2 py-2 flex items-center gap-4"
                    key={req.id}
                  >
                    <div className="w-10 h-10 rounded-full relative">
                      <Image
                        src={req.sender.pfp || Pfp}
                        alt={`${req.sender.username}'s profile picture`}
                        fill
                        className="rounded-full"
                      ></Image>
                    </div>
                    <h1>{req.sender.username}</h1>
                    <button
                      className="ml-auto hover:cursor-pointer"
                      onClick={() =>
                        incomingCancelMuation.mutate(req.sender.uid)
                      }
                    >
                      <FontAwesomeIcon icon={faX}></FontAwesomeIcon>
                    </button>
                    <button className="hover:cursor-pointer">
                      <FontAwesomeIcon
                        icon={faCheck}
                        onClick={() =>
                          acceptRequestMutation.mutate(req.sender.uid)
                        }
                      ></FontAwesomeIcon>
                    </button>
                  </div>
                ))}
                {incomingLoading && (
                  <div className="flex items-center justify-center">
                    <h1>Loading...</h1>
                  </div>
                )}
                {incomingError && (
                  <div className="flex items-center justify-center">
                    <h1>{incomingError.message}</h1>
                  </div>
                )}
                {!incomingLoading && incomingRequest.length == 0 && (
                  <div className=" border-black flex h-full items-center justify-center">
                    <h1 className="text-gray-500">
                      No incoming friend requests
                    </h1>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
