import DisplayUser from "./displayUser";
import SearchArea from "./searchArea";

export default function Search() {
  return (
    <div className="flex h-full px-4 gap-4 pt-4">
      <SearchArea></SearchArea>
      <DisplayUser></DisplayUser>
    </div>
  );
}
