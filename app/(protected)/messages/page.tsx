import ConversationArea from "./conversationArea";
import MessagesArea from "./messages";

export default function Messages() {
  return (
    <div className="flex h-screen px-4 gap-4 pt-4">
      <MessagesArea></MessagesArea>
      <ConversationArea></ConversationArea>
    </div>
  );
}
