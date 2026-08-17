"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCross, faX } from "@fortawesome/free-solid-svg-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

async function getUsername(userID: string) {
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("uid", userID)
    .single();
  if (error) {
    console.error(error);
  }
  return data;
}

export default function IncomingCalls({ userID }: { userID: string }) {
  const [username, setUsername] = useState<string>();
  const [incomingCall, setIncomingCall] = useState<any>();
  const [callerUID, setCallerUID] = useState<string>();
  const router = useRouter();
  const callTimeout = useRef<NodeJS.Timeout | null>(null);
  const ringToneref = useRef<HTMLAudioElement | null>(null);

  const callStatusMutation = useMutation({
    mutationFn: async ({
      callID,
      status,
    }: {
      callID: string;
      status: "accepted" | "declined";
    }) => {
      const res = await fetch("/api/calls/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ callID, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return { data, status };
    },
    onSuccess: ({ data, status }) => {
      if (callTimeout.current) {
        clearTimeout(callTimeout.current);
        callTimeout.current = null;
      }
      if (status == "accepted") {
        setIncomingCall(null);
        setUsername(undefined);
        router.push(
          `/calls?callID=${data.id}&role=receiver&type=${incomingCall.type}&uid=${incomingCall.caller_id}`,
        );
      } else if (status == "declined") {
        return;
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });

  useEffect(() => {
    console.log("IncomingCalls userID:", userID);
    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `receiver_id=eq.${userID}`,
        },
        (payload) => {
          async function handleIncomingCall() {
            const call = payload.new;
            const caller = await getUsername(call.caller_id);
            setCallerUID(call.call_id);
            setUsername(caller?.username);
            console.log("Incoming call!");
            setIncomingCall(call);
            console.log(payload.new);
            callTimeout.current = setTimeout(() => {
              setIncomingCall(null);
              setUsername(undefined);
              callStatusMutation.mutate({
                callID: call.id,
                status: "declined",
              });
            }, 10000);
          }
          handleIncomingCall();
        },
      )
      .subscribe((status) => {
        console.log("Realtime status: ", status);
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userID]);
  useEffect(() => {
    return () => {
      if (callTimeout.current) {
        clearTimeout(callTimeout.current);
      }
    };
  }, []);
  useEffect(() => {
    if (incomingCall) {
      ringToneref.current?.play().catch((err) => {
        console.log("Could not play ringtone: ", err);
      });
    } else {
      ringToneref.current?.pause();
      if (ringToneref.current) {
        ringToneref.current.currentTime = 0;
      }
    }
  }, [incomingCall]);
  return (
    <>
      <audio ref={ringToneref} src="/nokia_ringtone.mp3" loop></audio>
      {incomingCall && (
        <div className="fixed bottom-5 gap-3 right-5 bg-white text-black p-5 rounded-2xl flex flex-col items-center justify-center min-w-1/6 z-90">
          <h1>Incoming {incomingCall?.type} call</h1>
          <h1 className="text-2xl">{username}</h1>
          <div className="flex justify-evenly w-full text-white *:hover:cursor-pointer">
            <button
              className="bg-green-500 h-8 w-8 rounded-full"
              onClick={() =>
                callStatusMutation.mutate({
                  callID: incomingCall.id,
                  status: "accepted",
                })
              }
              disabled={callStatusMutation.isPending}
            >
              <FontAwesomeIcon icon={faCheck}></FontAwesomeIcon>
            </button>
            <button
              className="bg-red-500 h-8 w-8 rounded-full"
              onClick={() =>
                callStatusMutation.mutate({
                  callID: incomingCall.id,
                  status: "declined",
                })
              }
              disabled={callStatusMutation.isPending}
            >
              <FontAwesomeIcon icon={faX}></FontAwesomeIcon>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
