"use client";
import { useRouter, useSearchParams } from "next/navigation";
import CallVideo from "./components/CallVideo";
import CallVideoRec from "./components/CallVideoRec";

type Props = {
  activeCall: {
    userID: string;
    callID: string;
    role: "caller" | "receiver";
    type: "audio" | "video";
  } | null;
};

export default function VideoArea({ activeCall }: Props) {
  const searchParams = useSearchParams();
  const CallID = searchParams.get("callID");
  const type = searchParams.get("type");
  const role = searchParams.get("role");
  const uid = searchParams.get("uid");

  

  return (
    <div
      className={`flex-2 mt-auto flex flex-col rounded-t-xl ${CallID ? "h-full" : "h-fit"} bg-[#2d2f42e8] font-sans`}
    >
      {(activeCall && activeCall.role == "caller") ||
      (CallID && role == "caller" && uid) ? (
        <>
          <CallVideo
            activeCall={
              activeCall || {
                callID: CallID!,
                userID: uid!,
                type: type as "audio" | "video",
              }
            }
          ></CallVideo>
        </>
      ) : null}
      {CallID && type && role == "receiver" && (
        <>
          <CallVideoRec
            activeCall={{
              callID: CallID,
              type: type as "audio" | "video",
              role: "receiver",
              userID: uid as string,
            }}
          ></CallVideoRec>
        </>
      )}
    </div>
  );
}
