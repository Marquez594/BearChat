export type UserType = {
  uid: string;
  username: string;
  firstname: string;
  lastname: string;
  pfp: string;
  status: string;
  created_at: string;
};

export type SearchUserType = {
  uid: string;
  username: string;
  pfp: string;
  status: string;
};

export type PendingRequestType = {
  id: string;
  receiver: {
    uid: string;
    username: string;
    pfp: string;
    status: string;
  };
};

export type IncomingFriendRequestType = {
  id: string;
  sender: {
    uid: string;
    username: string;
    pfp: string;
    status: string;
  };
};

export type FriendRequestsType = {
  id: string;
  friend: {
    uid: string;
    username: string;
    pfp: string;
    status: string;
  };
};

export type ConversationsType = {
  current_user: string,
  messages: {
    content: string;
    conversation_id: string;
    created_at: string;
    deleted: boolean;
    edited: boolean;
    id: string;
    sender_id: string;
  }[];
  otherUser: {
    pfp: string;
    status: string;
    uid: string;
    username: string;
  };
};
