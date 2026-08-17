"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faPhone,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import { SearchUserType } from "@/lib/types";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { useRouter } from "next/navigation";
type Props = {
  activeCall: {
    userID: string;
    callID: string;
    type: "audio" | "video";
  } | null;
};

export default function CallVideo({ activeCall }: Props) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pendingCandidates = useRef<any[]>([]);
  const hasCreatedOffer = useRef(false);

  const [volume, setVolume] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [cameraOff, setCameraOff] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const [callEnd, setCallEnd] = useState<boolean>(false);
  const [ringing, setRinging] = useState<boolean>(false);

  const { createPeerConnection, peerConnection } = useWebRTC();

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

  const cleanupCall = async () => {
    const pc = peerConnection.current;
    setRinging(false);
    if (pc) {
      pc.close();
      peerConnection.current = null;
    }
    hasCreatedOffer.current = false;
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
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    router.push('/')
  };

  const hangUp = async () => {
    cleanupCall();
    await supabase
      .from("calls")
      .update({
        status: "declined",
      })
      .eq("id", activeCall?.callID);
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

  useEffect(() => {
    if (activeCall) {
      setCallEnd(false);
    }
  }, [activeCall?.callID]);

  useEffect(() => {
    const pc = peerConnection.current;

    if (pc) {
      pc.close();
      peerConnection.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    setCameraOff(false);
    setRinging(true);
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: activeCall?.type == "video",
        audio: true,
      });

      localStream.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log(remoteVideoRef.current?.readyState);
        console.log(remoteVideoRef.current?.videoWidth);
        console.log(remoteVideoRef.current?.videoHeight);
      }
      const pc = createPeerConnection();
      pc.oniceconnectionstatechange = () => {
        console.log("ICE:", pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection:", pc.connectionState);
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log("Remote stream received");

        const stream = event.streams[0];

        console.log("Stream active:", stream.active);
        console.log("Video tracks:", stream.getVideoTracks());
        console.log("Audio tracks:", stream.getAudioTracks());

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;

          remoteVideoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            remoteVideoRef.current?.play();
          };
        }
        console.log(event.track.kind);
        console.log(event.track.readyState);
        console.log(event.track.enabled);
      };

      pc.onicecandidate = async (event) => {
        if (!event.candidate) return;
        console.log("New ICE candidate", event.candidate);
        await supabase.from("ice_candidates").insert({
          call_id: activeCall?.callID,
          sender: "caller",
          candidate: event.candidate.toJSON(),
        });
      };
      pc.oniceconnectionstatechange = () => {
        console.log("ICE STATE:", pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log("CONNECTION STATE:", pc.connectionState);
      };
    }
    startCamera();
  }, [activeCall?.callID]);

  useEffect(() => {
    if (!activeCall) {
      setCallEnd(false);
      setRinging(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [activeCall]);

  useEffect(() => {
    if (!activeCall) return;
    setCallEnd(false);
    const channel = supabase
      .channel(`call-${activeCall.callID}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `id=eq.${activeCall.callID}`,
        },
        (payload) => {
          async function handleCallUpdate() {
            const pc = peerConnection.current;
            if (!pc) return;

            if (payload.new.status === "accepted" && !hasCreatedOffer.current) {
              hasCreatedOffer.current = true;
              const offer = await pc.createOffer();
              setRinging(false);
              await pc.setLocalDescription(offer);

              await supabase
                .from("calls")
                .update({
                  offer: pc.localDescription,
                })
                .eq("id", activeCall?.callID);
            }

            if (
              payload.new.answer &&
              pc.signalingState === "have-local-offer"
            ) {
              await pc.setRemoteDescription(
                new RTCSessionDescription(payload.new.answer),
              );

              console.log("Remote answer set");

              for (const candidate of pendingCandidates.current) {
                console.log("ADDING PENDING ICE:", candidate);

                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidates.current = [];
            }
            if (payload.new.status == "declined") {
              console.log("User hanged up");
              cleanupCall();
              return;
            }
          }

          handleCallUpdate();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCall]);

  useEffect(() => {
    if (!activeCall) return;
    const candidateChannel = supabase
      .channel(`ice-${activeCall.callID}`)
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

          console.log("CALLER RECEIVED ICE:", candidate);

          if (candidate.sender === "caller") return;

          const pc = peerConnection.current;
          if (!pc) return;

          if (!pc.remoteDescription) {
            pendingCandidates.current.push(candidate.candidate);
            return;
          }

          console.log("ADDING REMOTE ICE:", candidate.candidate);
          await pc.addIceCandidate(new RTCIceCandidate(candidate.candidate));

          console.log("Added receiver ICE candidate");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(candidateChannel);
    };
  }, [activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = volume;
    }
  }, [volume]);

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
          {ringing && <h1 className="top-2 absolute text-2xl">Ringing</h1>}
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
          <h1 className="text-4xl">Call Endedd</h1>
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
