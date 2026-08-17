"use client";

import { supabase } from "@/lib/supabase";
import { FriendRequestsType, SearchUserType } from "@/lib/types";
import {
  faMinus,
  faPlus,
  faSearch,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function FriendArea() {
  const [friendArea, setFriendArea] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(search);
  }

  const {
    data: friendRequests = [],
    isLoading: requestsLoading,
    error: requestError,
  } = useQuery({
    queryKey: ["friendRequest"],
    queryFn: async () => {
      const res = await fetch("/api/users/getFriends", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      return data as FriendRequestsType[];
    },
  });

  function displayUser(userid: string) {
    const params = new URLSearchParams();
    params.set("friend", userid);
    router.push(`/contacts?${params.toString()}`);
  }

  const filteredResults = friendRequests.filter((user) =>
    user.friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <div
      className={`flex flex-col flex-1 bg-[#ffffff] ${friendArea ? "h-full" : "h-fit"} rounded-t-xl mt-auto`}
    >
      {/**Friend Area*/}
      <button
        className="bg-[#006241] py-2 px-4 w-full flex rounded-t-xl text-xl items-center hover:cursor-pointer"
        onClick={() => setFriendArea((prev) => !prev)}
      >
        <h1>Friends</h1>
        {friendArea ? (
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
      {friendArea && (
        <div className="flex-1 text-black p-2 flex flex-col gap-5">
          <form className="relative" onSubmit={handleSearchSubmit}>
            <input
              className="w-full bg-gray-200 rounded-md p-2 pr-10"
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            ></input>
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
            ></FontAwesomeIcon>
          </form>
          <div className=" flex-1 flex flex-col items-center justify-center overflow-y-scroll">
            {filteredResults.length == 0 ? (
              <div className="flex flex-col h-fit w-2/3 items-center gap-2 text-gray-600">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-8xl"
                ></FontAwesomeIcon>
                <h1 className="text-center">Seem empty here</h1>
                <Link href={"/search"}>
                  Click here to search for new friends
                </Link>
              </div>
            ) : (
              <div className=" h-full w-full overflow-y-auto">
                {filteredResults.map((user) => (
                  <button
                    key={user.friend.uid}
                    onClick={() => displayUser(user.friend.uid)}
                    className="flex p-2 border-b-2 border-gray-400 items-center gap-2 w-full hover:cursor-pointer"
                  >
                    <div className="relative h-fit">
                      <Image
                        src={user.friend.pfp || Pfp}
                        height={35}
                        width={35}
                        className="rounded-full"
                        alt={`${user.friend.username}'s profile picture`}
                      ></Image>
                      <div
                        className={`absolute h-3 w-3 -right-1 bottom-px rounded-full ${user?.friend?.status == "Online" ? "bg-green-500" : user?.friend?.status == "Offline" ? "bg-gray-400" : user?.friend?.status == "Away" ? "bg-yellow-400" : null}`}
                      ></div>
                    </div>
                    <h1>{user.friend.username}</h1>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
