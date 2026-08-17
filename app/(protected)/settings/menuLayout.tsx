"use client";

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Account from "./account";

export default function MenuLayout() {
  const [options, setOptions] = useState<"account" | "privacy">("account");
  return (
    <div className="h-5/8 w-9/10 md:w-3/4 bg-[#2d2f42e8] flex rounded-2xl overflow-hidden ">
      <div className="bg-[#006241] h-full  w-20 flex flex-col items-center pt-5 pb-5 gap-5">
        <button
          className="hover:cursor-pointer"
          onClick={() => setOptions("account")}
        >
          <FontAwesomeIcon
            icon={faUser}
            size="xl"
            className="text-[#2d2f42e8]"
          ></FontAwesomeIcon>
        </button>
      </div>
      <div className="w-full pt-2">
        {options == "account" && (
            <Account></Account>
        )}
      </div>
    </div>
  );
}
