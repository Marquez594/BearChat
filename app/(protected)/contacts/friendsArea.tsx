"use client";

import { supabase } from "@/lib/supabase";
import { SearchUserType } from "@/lib/types";
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

export default function FriendArea() {
  const [friendArea, setFriendArea] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchUserType[]>([]);
  const router = useRouter();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (search == "") {
      setSearchResults([]);
      return;
    }
    const fetchFriendSearch = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("uid,username,pfp,status")
        .ilike("username", `${search}%`);
      if (!error) {
        setSearchResults(data);
      }
    };
    fetchFriendSearch();
  }

  function displayUser(user: string) {
    const params = new URLSearchParams();
    params.set("User", user);
    router.push(`/search?${params.toString()}`);
  }

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
        <div className="flex-1 text-black p-2 flex flex-col gap-5 border ">
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
          <div className=" flex-1 flex flex-col items-center justify-center">
            {searchResults.length == 0 ? (
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
              <div className=" h-full w-full">
                {searchResults.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => displayUser(user.username)}
                    className="flex p-2 border-b-2 border-gray-400 items-center gap-2 w-full hover:cursor-pointer"
                  >
                    <Image
                      src={Pfp}
                      height={35}
                      width={35}
                      className="rounded-full"
                      alt={`${user.username}'s profile picture`}
                    ></Image>
                    <h1>{user.username}</h1>
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
