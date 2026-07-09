import { createClient } from "@/lib/server";
import { faMessage, faPhone, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-[#1c2626] gap-8 h-full">
      <div>
        <h1 className="text-4xl">Welcome, {profile?.username}</h1>
        <h1 className="text-xl">
          Start by messaging or calling a friend by selecting one of the options
          below
        </h1>
      </div>
      <div className="w-1/3 flex gap-4 h-fit">
        <div className="flex-1">
          {/**Video */}
          <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
            <FontAwesomeIcon icon={faVideo} size="lg"></FontAwesomeIcon>
          </button>
        </div>
        <div className="flex-1">
          {/**Phone */}
          <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
            <FontAwesomeIcon icon={faPhone} size="lg"></FontAwesomeIcon>
          </button>
        </div>
        <div className="flex-1">
          {/**Message */}
          <button className="w-20 h-20 border-white border rounded-full hover:cursor-pointer">
            <FontAwesomeIcon icon={faMessage} size="lg"></FontAwesomeIcon>
          </button>
        </div>
      </div>
    </div>
  );
}
