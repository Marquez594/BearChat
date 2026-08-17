import ProfileArea from "@/components/profile";
import { supabase } from "@/lib/supabase";
import BearPaw from "@/public/logo.png";
import {
  faAddressBook,
  faMessage,
  faPhoneVolume,
  faSearch,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";

export default async function SideBar({ user }: any) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", user.id)
    .single();

  if (error) {
    console.log(error?.message);
  }

  return (
    <nav className="bg-[#006241] flex flex-col md:w-1/20 p-4 items-center">
      <Link href={"/"} className="w-12 h-12">
        <Image src={BearPaw} alt="Logo"></Image>
      </Link>
      <div className="flex flex-col items-center mt-10 gap-8 text-xl text-black">
        {/**Options*/}
        <Link href={"/search"} className="">
          <FontAwesomeIcon
            icon={faSearch}
            className="w-12 h-12"
          ></FontAwesomeIcon>
        </Link>
        <Link href={"/contacts"}>
          <FontAwesomeIcon
            icon={faAddressBook}
            className="w-12 h-12"
          ></FontAwesomeIcon>
        </Link>
        <Link href={"/messages"}>
          <FontAwesomeIcon
            icon={faMessage}
            className="w-12 h-12"
          ></FontAwesomeIcon>
        </Link>
        <Link href={"/calls"}>
          <FontAwesomeIcon
            icon={faPhoneVolume}
            className="w-12 h-12"
          ></FontAwesomeIcon>
        </Link>
        <Link href={"/settings"}>
          <FontAwesomeIcon
            icon={faSliders}
            className="w-12 h-12"
          ></FontAwesomeIcon>
        </Link>
      </div>
      <div className="mt-auto">
        <ProfileArea data={data}></ProfileArea>
      </div>
    </nav>
  );
}
