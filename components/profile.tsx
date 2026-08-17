"use client";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { UserType } from "@/lib/types";
import React, { useEffect, useRef, useState } from "react";
import SignOutButton from "./logoutButton";
import { supabase } from "@/lib/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import Cropper from "react-easy-crop";

type ProfileAreaProps = {
  data: UserType;
};

export default function ProfileArea({ data }: ProfileAreaProps) {
  const [openDetails, setOpenDetails] = useState<boolean>(false);
  const [openProfileSettings, setOpenProfileSettings] =
    useState<boolean>(false);
  const [status, setStatus] = useState(data.status);
  const [dataPfp, setDataPfp] = useState<string>(data.pfp);
  const profileSetingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string>();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>();

  const handleChangeStatus = async (
    newStatus: "Online" | "Away" | "Offline",
  ) => {
    if (newStatus == status) return;

    const { error } = await supabase
      .from("users")
      .update({ status: newStatus })
      .eq("uid", data.uid);
    if (error) {
      console.error(error?.message);
      return;
    }
    setStatus(newStatus);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const img = new window.Image();
    img.src = image!;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx?.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "profile.png", {
        type: "image/png",
      });
      const filename = `${data.uid}/profile.png`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filename, file, {
          upsert: true,
        });
      if (error) {
        console.error(error.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filename);

      const newPfp = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("users")
        .update({
          pfp: `${publicUrl}?t=${Date.now()}`,
        })
        .eq("uid", data.uid);

      setImage(undefined);
      setDataPfp(newPfp);
    }, "image/png");
  };

  useEffect(() => {
    function handleOutsideClicks(e: MouseEvent) {
      if (
        profileSetingsRef.current &&
        !profileSetingsRef.current.contains(e.target as Node)
      ) {
        setOpenProfileSettings(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClicks);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClicks);
    };
  }, []);
  return (
    <div className="border rounded-full relative" ref={profileSetingsRef}>
      <div className="md:w-12 md:h-12 w-8 h-8">
        <Image
          src={dataPfp || Pfp}
          alt="Pfp"
          fill
          className="rounded-full"
          onMouseEnter={() => {
            if (openProfileSettings) return;
            setOpenDetails(true);
          }}
          onMouseLeave={() => setOpenDetails(false)}
          onClick={() => {
            setOpenDetails(false);
            setOpenProfileSettings((prev) => !prev);
          }}
        ></Image>
      </div>
      <div
        className={`w-3 h-3 absolute ${status == "Offline" ? "bg-gray-400" : status == "Online" ? "bg-green-500" : status == "Away" ? "bg-yellow-500" : null} rounded-full right-0 -bottom-1`}
      ></div>
      {openDetails && (
        <div className="w-fit absolute bottom-12 bg-[#000000] rounded-xl p-2 h-fit flex flex-col items-end gap-2">
          <h1>@{data.username}</h1>
          <div className="flex items-center gap-2 border-2 border-[#718a53] p-1 px-3 rounded-xl">
            <div
              className={`rounded-full h-2 w-2 ${status == "Offline" ? "bg-gray-400" : status == "Online" ? "bg-green-500" : status == "Away" ? "bg-yellow-500" : null}`}
            ></div>
            <h1>{status}</h1>
          </div>
        </div>
      )}
      {openProfileSettings && (
        <div className="w-64 absolute bottom-12 h-fit bg-[#000000] rounded-xl p-2 flex flex-col items-center gap-3">
          <div className="flex items-center w-full">
            <div className="flex-1 flex items-center justify-center relative">
              <Image
                src={dataPfp || Pfp}
                alt="Pfp"
                width={80}
                height={80}
                className="rounded-full "
              ></Image>
              <button
                className="-bottom-2 absolute right-4 bg-[#1C2626] rounded-full p-1 hover:cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FontAwesomeIcon icon={faPen}></FontAwesomeIcon>
              </button>
              <input
                type="file"
                hidden
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
              ></input>
              {image && (
                <div className="inset-0 fixed flex justify-center items-center bg-black/70 z-40">
                  <div className="w-2/3 h-2/3 bg-[#1C2626] rounded-2xl p-4 flex flex-col items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, croppedPixels) =>
                          setCroppedAreaPixels(croppedPixels)
                        }
                      ></Cropper>
                    </div>
                    <input
                      className="w-2/3"
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    ></input>
                    <div className="flex w-full">
                      <button className="flex-1" onClick={() => setImage("")}>
                        Close
                      </button>
                      <button
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </button>
                      <button className="flex-1" onClick={handleSave}>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex-col flex gap-2 *:hover:cursor-pointer">
              <button
                className={`flex items-center justify-center gap-2 border rounded-md ${status == "Online" ? "border-green-500" : "border-gray-600"}`}
                onClick={() => handleChangeStatus("Online")}
              >
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <h1>Online</h1>
              </button>
              <button
                className={`flex items-center justify-center gap-2 border rounded-md ${status == "Offline" ? "border-green-500" : "border-gray-600"}`}
                onClick={() => handleChangeStatus("Offline")}
              >
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <h1>Offline</h1>
              </button>
              <button
                className={`flex items-center justify-center gap-2 border rounded-md ${status == "Away" ? "border-green-500" : "border-gray-600"}`}
                onClick={() => handleChangeStatus("Away")}
              >
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <h1>Away</h1>
              </button>
            </div>
          </div>
          <SignOutButton
            className={
              "bg-red-600 text-black w-3/4 rounded-md hover:cursor-pointer font-bold"
            }
          ></SignOutButton>
        </div>
      )}
    </div>
  );
}
