import { createClient } from "@/lib/server";
import { faMessage, faPhone, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("Error");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("uid", user?.id)
    .single();

  if (error) {
    console.log(error?.message);
  }

  return (
    <div className="flex flex-col p-4 flex-1 items-center justify-center font-sans bg-[#1c2626] gap-8 h-full lg:w-full">
      <div>
        <h1 className="text-3xl md:text-4xl">Welcome, {profile?.username}</h1>
        <h1 className="md:text-xl text-md">
          Start by messaging or calling a friend by selecting one of the options
          below
        </h1>
      </div>
      <div className="w-fit flex gap-4 h-fit justify-evenly ">
        <div className="">
          {/**Video */}
          <Link
            href={"/calls"}
            className="flex items-center justify-center w-20 h-20 border-white border rounded-full hover:cursor-pointer"
          >
            <FontAwesomeIcon icon={faVideo} size="lg"></FontAwesomeIcon>
          </Link>
        </div>
        <div className="">
          {/**Phone */}
          <Link
            href={"/calls"}
            className="flex items-center justify-center w-20 h-20 border-white border rounded-full hover:cursor-pointer"
          >
            <FontAwesomeIcon icon={faPhone} size="lg"></FontAwesomeIcon>
          </Link>
        </div>
        <div className="">
          {/**Message */}
          <Link
            href={"/messages"}
            className="flex items-center justify-center w-20 h-20 border-white border rounded-full hover:cursor-pointer"
          >
            <FontAwesomeIcon icon={faMessage} size="lg"></FontAwesomeIcon>
          </Link>
        </div>
      </div>
    </div>
  );
}
