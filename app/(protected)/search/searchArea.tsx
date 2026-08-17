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
import {useState } from "react";
import Image from "next/image";
import Pfp from "@/public/defaultpfp.jpg";
import { useRouter } from "next/navigation";

export default function SearchArea() {
  const [searchArea, setSearchArea] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchUserType[]>([]);
  const router = useRouter();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (search == "") {
      setSearchResults([]);
      return;
    }
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("uid,username,pfp,status")
        .ilike("username", `${search}%`);
      if (!error) {
        setSearchResults(data);
      }
    };
    fetchUsers();
  }

  function displayUser(userid: string) {
    const params = new URLSearchParams();
    params.set("User", userid);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div
      className={`flex flex-col flex-2 md:flex-3 bg-[#ffffff] ${searchArea ? "h-full" : "h-fit"} rounded-t-xl mt-auto`}
    >
      {/**Search Area*/}
      <button
        className="bg-[#006241] py-2 px-4 w-full flex rounded-t-xl text-xl items-center hover:cursor-pointer"
        onClick={() => setSearchArea((prev) => !prev)}
      >
        <h1>Search</h1>
        {searchArea ? (
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
      {searchArea && (
        <div className="flex-1 text-black p-2 flex flex-col gap-5  ">
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
          <div className=" flex-1 flex flex-col items-center justify-center  overflow-y-scroll">
            {searchResults.length == 0 ? (
              <div className="flex flex-col h-fit w-2/3 items-center gap-2 text-gray-600">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-8xl"
                ></FontAwesomeIcon>
                <h1 className="text-center">
                  Search for some new friends using the search bar above
                </h1>
              </div>
            ) : (
              <div className=" h-full w-full">
                {searchResults.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => displayUser(user.uid)}
                    className="flex p-2 border-b-2 border-gray-400 items-center gap-2 w-full hover:cursor-pointer"
                  >
                    <Image
                      src={ user.pfp || Pfp}
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
