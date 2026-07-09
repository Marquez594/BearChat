"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPhone,
  faVideo,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

export default function DisplayUser() {
  const searchParam = useSearchParams();
  const query = searchParam.get("User");

  const [displayArea, setDisplayArea] = useState<boolean>(true);

  return (
    <div
      className={`flex-3 mt-auto flex flex-col rounded-t-xl ${displayArea && query ? "h-full" : "h-fit"} bg-[#2d2f42e8] font-sans`}
    >
      {query && (
        <>
          <button
            className="bg-[#006241] py-2 px-4 w-full flex rounded-t-xl text-xl items-center hover:cursor-pointer"
            onClick={() => setDisplayArea((prev) => !prev)}
          >
            <h1>{query}</h1>
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
                <div className="relative h-58 w-58">
                  <Image
                    src={Pfp}
                    alt={`${query}'s profile picture`}
                    fill
                    className="rounded-full object-cover"
                  ></Image>
                </div>
                <h1 className="text-4xl font-sans">@{query}</h1>
                <div className="w-full flex gap-8 h-fit mt-8">
                  <div className="flex-1">
                    {/**Video */}
                    <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
                      <FontAwesomeIcon
                        icon={faVideo}
                        size="lg"
                      ></FontAwesomeIcon>
                    </button>
                  </div>
                  <div className="flex-1">
                    {/**Phone */}
                    <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
                      <FontAwesomeIcon
                        icon={faPhone}
                        size="lg"
                      ></FontAwesomeIcon>
                    </button>
                  </div>
                  <div className="flex-1">
                    {/**Message */}
                    <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
                      <FontAwesomeIcon
                        icon={faMessage}
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
