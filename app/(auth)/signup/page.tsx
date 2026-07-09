import Link from "next/link";
import SignUpForm from "@/components/signUpForm";

export default function Signup() {
  return (
    <div className="bg-[#1c2626] h-screen flex flex-col justify-center items-center">
      <div className="w-1/4 h-fit bg-[#394130] rounded-xl p-2 py-8 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold font-mono">Sign Up</h1>
        <SignUpForm></SignUpForm>
        <h1 className="text-sm">
          Already have an account?{" "}
          <Link href={"/login"} className="underline">
            Login
          </Link>
        </h1>
      </div>
    </div>
  );
}
