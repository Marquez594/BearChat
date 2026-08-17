"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useWebRTC } from "../hooks/useWebRTC";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { useQuery } from "@tanstack/react-query";
import { SearchUserType } from "@/lib/types";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

type Props = {
  activeCall: {
    userID: string;
    callID: string;
    role: "caller" | "receiver";
    type: "audio" | "video";
  } | null;
};

function waitForIce(pc: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }

    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", check);
  });
}

export default function CallVideoRec({ activeCall }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [cameraOff, setCameraOff] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const [callEnd, setCallEnd] = useState<boolean>(false);
  const handledOffer = useRef(false);
  const started = useRef(false);
  const pendingCandidates = useRef<any[]>([]);
  const callChannel = useRef<any>(null);
  const iceChannel = useRef<any>(null);

  const router = useRouter();

  const { createPeerConnection, peerConnection } = useWebRTC();

  const cleanupCall = () => {
    console.log("Cleaning up");
    const pc = peerConnection.current;

    if (pc) {
      pc.close();
      peerConnection.current = null;
    }

    handledOffer.current = false;
    started.current = false;
    pendingCandidates.current = [];

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());

      videoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (callChannel.current) {
      supabase.removeChannel(callChannel.current);
      callChannel.current = null;
    }

    if (iceChannel.current) {
      supabase.removeChannel(iceChannel.current);
      iceChannel.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    router.push("/");
  };

  const toggleCamera = () => {
    if (!localStream.current) return;

    const videoTrack = localStream.current.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOff(!videoTrack.enabled);
    }
  };
  const toggleMute = () => {
    if (!localStream.current) return;

    const audioTrack = localStream.current.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    setMuted(!audioTrack.enabled);
  };

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", activeCall?.userID],
    queryFn: async () => {
      const res = await fetch(
        `/api/users/getUser?friend=${activeCall?.userID}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data as SearchUserType;
    },
  });

  const hangUp = async () => {
    cleanupCall();

    await supabase
      .from("calls")
      .update({
        status: "declined",
      })
      .eq("id", activeCall?.callID);
  };

  useEffect(() => {
    if (!activeCall?.callID) return;

    setCallEnd(false);
    handledOffer.current = false;
    pendingCandidates.current = [];
    started.current = false;
  }, [activeCall?.callID]);

  useEffect(() => {
    if (!activeCall) return;

    if (started.current) return;

    started.current = true;

    async function startReceiver() {
      console.log("starting receiver");
      setCallEnd(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: activeCall?.type == "video",
        audio: true,
      });
      localStream.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();

      pc.oniceconnectionstatechange = () => {
        console.log("ICE:", pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log("CONNECTION:", pc.connectionState);
      };

      pc.onicecandidateerror = (e) => {
        console.log("ICE ERROR", e);
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log("Remote stream received");

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;

        console.log("Receiver ICE", event.candidate);

        await supabase.from("ice_candidates").insert({
          call_id: activeCall?.callID,

          sender: "receiver",

          candidate: event.candidate.toJSON(),
        });
      };

      callChannel.current = supabase
        .channel(`receiver-call-${activeCall?.callID}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "calls",
            filter: `id=eq.${activeCall?.callID}`,
          },

          async (payload) => {
            const call = payload.new;

            if (payload.new.status === "declined") {
              console.log("Other user hung up");

              cleanupCall();

              return;
            }

            if (call.offer && !handledOffer.current) {
              handledOffer.current = true;

              console.log("Offer received");

              await pc.setRemoteDescription(
                new RTCSessionDescription(call.offer),
              );

              const answer = await pc.createAnswer();

              await pc.setLocalDescription(answer);

              await waitForIce(pc);

              await supabase
                .from("calls")
                .update({
                  answer: pc.localDescription,
                })
                .eq("id", activeCall?.callID);

              console.log("Answer sent");

              for (const candidate of pendingCandidates.current) {
                console.log("Adding queued ICE", candidate);

                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }

              pendingCandidates.current = [];
            }
          },
        )
        .subscribe();
    }

    startReceiver();

    return () => {
      if (callChannel.current) {
        supabase.removeChannel(callChannel.current);
        callChannel.current = null;
      }

      if (iceChannel.current) {
        supabase.removeChannel(iceChannel.current);
        iceChannel.current = null;
      }
    };
  }, [activeCall?.callID]);

  useEffect(() => {
    if (!activeCall) return;

    iceChannel.current = supabase
      .channel(`receiver-ice-${activeCall.callID}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",

          schema: "public",

          table: "ice_candidates",

          filter: `call_id=eq.${activeCall.callID}`,
        },

        async (payload) => {
          const candidate = payload.new;

          if (candidate.sender === "receiver") return;

          const pc = peerConnection.current;

          if (!pc) return;

          if (!pc.remoteDescription) {
            console.log("Queue ICE");

            pendingCandidates.current.push(candidate.candidate);

            return;
          }

          console.log("Adding caller ICE");

          await pc.addIceCandidate(new RTCIceCandidate(candidate.candidate));
        },
      )
      .subscribe();

    return () => {
      if (iceChannel.current) {
        supabase.removeChannel(iceChannel.current);
      }
    };
  }, [activeCall?.callID]);

  return (
    <div className="flex flex-1 items-center justify-center relative">
      {!callEnd ? (
        <>
          {activeCall?.type == "video" && (
            <>
              <video
                ref={videoRef}
                muted
                autoPlay
                playsInline
                className="w-1/4 h-1/4 absolute bottom-0 right-0 object-cover rounded-2xl scale-x-[-1]"
              ></video>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />
            </>
          )}
          {activeCall?.type == "audio" && (
            <>
              <div className="flex flex-col items-center gap-5">
                <div className="h-38 w-38 rounded-full relative">
                  <Image
                    src={userData?.pfp || Pfp}
                    fill
                    alt={`${userData?.username} profile picture`}
                    className="rounded-full object-cover"
                  ></Image>
                </div>
                <h1 className="text-3xl">{userData?.username}</h1>
                <video ref={videoRef} muted autoPlay playsInline hidden></video>
                <video ref={remoteVideoRef} autoPlay playsInline hidden />
              </div>
            </>
          )}
          <button
            className="bg-red-500 h-12 w-12 rounded-full hover:cursor-pointer bottom-4 absolute "
            onClick={hangUp}
          >
            <FontAwesomeIcon icon={faPhone}></FontAwesomeIcon>
          </button>
          <input
            type="range"
            max={1}
            min={0}
            step={0.01}
            value={volume}
            className="w-1/5 absolute bottom-6 left-4"
            onChange={(e) => setVolume(Number(e.target.value))}
          ></input>
          <button
            className="w-10 h-10 absolute rounded-full bg-black top-2 right-4 hover:cursor-pointer"
            onClick={toggleMute}
          >
            {!muted ? (
              <FontAwesomeIcon icon={faMicrophone}></FontAwesomeIcon>
            ) : (
              <FontAwesomeIcon icon={faMicrophoneSlash}></FontAwesomeIcon>
            )}
          </button>
          {activeCall?.type == "video" && (
            <button
              className="w-10 h-10 absolute rounded-full bg-black top-2 left-4 hover:cursor-pointer"
              onClick={toggleCamera}
            >
              {muted ? (
                <FontAwesomeIcon icon={faVideo}></FontAwesomeIcon>
              ) : (
                <FontAwesomeIcon icon={faVideoSlash}></FontAwesomeIcon>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-4xl">Call Endeddddd</h1>
          <div className="w-40 h-40 rounded-full relative mt-10">
            <Image
              src={userData?.pfp || Pfp}
              fill
              alt={`${userData?.username} profile picture`}
              className="rounded-full"
            ></Image>
          </div>
          <h1 className="text-3xl">{userData?.username}</h1>
        </div>
      )}
    </div>
  );
}
