// chat-app/src/App.js
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./ChatApp.css";

const socket = io("http://localhost:8000");

function ChatApp() {
  const [currentUserName, setCurrentUserName] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [chatUser, setChatUser] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showLogin, setShowLogin] = useState(true);
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    socket.on("userList", (userList) => {
      setCurrentUser(userList.loginUser);
      let chatUsers = userList.userList.filter(
        (user) => user !== userList.loginUser
      );
      chatUsers.push("all users");
      setUsers(chatUsers);
      setChatUser(chatUsers[0]);
      handleSelectChatUser(chatUsers[0]);
    });

    socket.on("newMessage", (chatMessage) => {
      setChat((prevChat) => [...prevChat, chatMessage]);
    });

    socket.on("messageList", (messageList) => {
      setChatUser(messageList.chatUser);
      setChat(messageList.messageList);
    });

    socket.on("loginFailed", () => {
      alert("Login failed. Please check your username and password.");
      setCurrentUser("");
    });

    socket.on("roomList", (rooms) => {
      setRooms(rooms);
    });

    socket.on("roomExists", (errorMessage) => {
      alert(`Create Room failed. ${errorMessage}`);
      setCurrentUser("");
    });

    socket.on("roomNotExists", (errorMessage) => {
      alert(`Join Room failed. ${errorMessage}`);
      setCurrentUser("");
    });

    return () => {
      socket.off("userList");
      socket.off("newMessage");
      socket.off("messageList");
      socket.off("loginFailed");
      socket.off("roomList");
      socket.off("roomExists");
      socket.off("roomNotExists");
    };
  }, []);

  const handleSendMessage = () => {
    const chatMessage = { user: currentUser, chatUser, message };
    socket.emit("sendMessage", chatMessage);
    setMessage("");
  };

  const handleSelectChatUser = (user) => {
    socket.emit("changeChatUser", user);
  };

  const handleUserLogin = () => {
    const credentials = { username: currentUserName, password };
    socket.emit("userLogin", credentials);
  };

  const handleRegister = () => {
    socket.emit("register", {
      username: registerUsername,
      password: registerPassword,
    });
  };

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  const joinRoom = (roomName) => {
    if (roomName !== "") {
      socket.emit("joinRoom", roomName);
      setCurrentRoomName(roomName);
    }
  };

  const leaveRoom = () => {
    if (currentRoomName !== "") {
      socket.emit("leaveRoom", currentRoomName);
      setCurrentRoomName("");
    }
  };

  const sendMessageToRoom = () => {
    if (message !== "" && currentRoomName !== "") {
      socket.emit(
        "sendMessageToRoom",
        { user: currentUser, message },
        currentRoomName
      );
      setMessage("");
    }
  };

  const createRoom = () => {
    if (newRoomName !== "") {
      socket.emit("createRoom", newRoomName);
    }
  };

  const selectRoom = (roomName) => {
    if (roomName !== "" && roomName !== currentRoomName) {
      setCurrentRoomName(roomName);
      socket.emit("joinRoom", roomName);
    }
  };

  if (!currentUser) {
    return (
      <div className="auth-container">
        {showLogin ? (
          // Login Form
          <div className="login">
            <input
              type="text"
              placeholder="Enter your username"
              onChange={(e) => setCurrentUserName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleUserLogin}>Login</button>
            <button onClick={toggleForm}>Go to Register</button>
          </div>
        ) : (
          // Registration Form
          <div className="register">
            <input
              type="text"
              placeholder="Choose a username"
              onChange={(e) => setRegisterUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Choose a password"
              onChange={(e) => setRegisterPassword(e.target.value)}
            />
            <button onClick={handleRegister}>Register</button>
            <button onClick={toggleForm}>Go to Login</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="chat-app">
      <div className="head">
        <div className="head-title">Users</div>
        <div className="head-user">{currentUser}</div>
      </div>
      <div className="chat">
        <div className="user-list">
          <ul>
            {users.map((user, index) => (
              <li
                key={index}
                className={user === chatUser ? "chat-user" : ""}
                onClick={() => handleSelectChatUser(user)}
              >
                {user}
              </li>
            ))}
          </ul>
        </div>
        <div className="chat-section">
          <div className="chat-box">
            {chat.map((chatMessage, index) => (
              <div key={index} className="chat-message">
                <strong>{chatMessage.user}: </strong>
                {chatMessage.message}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      </div>
      <div className="room-list">
        {Object.values(rooms).map((room, index) => (
          <div key={index} onClick={() => selectRoom(room.name)}>
            {room.name}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter room name"
          value={currentRoomName}
          onChange={(e) => setCurrentRoomName(e.target.value)}
        />
        <button onClick={() => joinRoom(currentRoomName)}>Join Room</button>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="New room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button onClick={createRoom}>Create Room</button>
      </div>
      ;
    </div>
  );
}

export default ChatApp;
