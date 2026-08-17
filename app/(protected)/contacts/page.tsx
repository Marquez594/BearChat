import DisplayFriend from "./displayFriend";
import FriendArea from "./friendsArea";
import FriendRequestArea from "./friendsRequest";

export default function Contacts() {
  return (
    <div className="flex md:flex-row flex-col  h-full px-4 gap-4 pt-4 ">
      <FriendArea></FriendArea>
      <FriendRequestArea></FriendRequestArea>
      <DisplayFriend></DisplayFriend>
    </div>
  );
}
