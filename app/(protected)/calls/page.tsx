"use client";

import { useState } from "react";
import FriendAreaCalls from "./friendsAreaCall";
import VideoArea from "./VideoArea";

export default function Calls() {
  const [activeCall, setActiveCall] = useState<{
    userID: string;
    callID: string;
    type: "audio" | "video";
    role: "caller" | "receiver";
  } | null>(null);
  return (
    <div className="flex h-full px-4 gap-4 pt-4">
      <FriendAreaCalls setActiveCall={setActiveCall}></FriendAreaCalls>
      <VideoArea activeCall={activeCall}></VideoArea>
    </div>
  );
}
