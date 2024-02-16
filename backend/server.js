// backend/server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Message = require("./models/Message");
const Room = require("./models/Room");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/chatApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const allUsers = "all users";

let loginUser = "";
let chatUser = "";

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("userLogin", async (credentials) => {
    try {
      const { username, password } = credentials;
      const user = await User.findOne({ username });

      if (user && bcrypt.compareSync(password, user.password)) {
        console.log(`${username} logged in`);
        loginUser = username;
        const userList = await User.find().select("username -_id");
        const usernames = userList.map((user) => user.username);

        io.emit("userList", {
          loginUser: username,
          userList: usernames,
        });

        const rooms = await Room.find({ users: loginUser });
        io.emit("roomList", rooms);
      } else {
        console.log(`Login failed for ${username}`);
        socket.emit("loginFailed");
      }
    } catch (error) {
      console.log("Error during login:", error);
      socket.emit("loginFailed");
    }
  });

  socket.on("register", async (credentials) => {
    try {
      const { username, password } = credentials;
      let existingUser = await User.findOne({ username });

      if (existingUser) {
        console.log(`Registration failed: ${username} already exists`);
      } else {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        console.log(`User registered: ${username}`);
      }
    } catch (error) {
      console.log("Error during registration:", error);
    }
  });

  socket.on("sendMessage", async (chatMessage, room) => {
    try {
      console.log("Message received in room:", room, "Message:", chatMessage);
      const message = new Message({ ...chatMessage, room });
      await message.save();
      io.to(room).emit("newMessage", chatMessage);
    } catch (error) {
      console.log("Error sending message:", error);
    }
  });

  socket.on("createRoom", async (roomName) => {
    try {
      let room = await Room.findOne({ name: roomName });
      if (!room) {
        room = new Room({ name: roomName, users: [loginUser] });
        await room.save();
        socket.join(roomName);

        const rooms = await Room.find({ users: loginUser });
        io.emit("roomList", rooms);
      } else {
        socket.emit("roomExists", `Room ${roomName} already exists.`);
      }
    } catch (error) {
      console.error("Error creating room:", error);
    }
  });

  socket.on("joinRoom", async (roomName) => {
    const room = await Room.findOne({ name: roomName });
    if (room) {
      socket.join(roomName);
      console.log(`User joined room: ${roomName}`);
      const roomObject = room.toObject();
      const roomUsers = roomObject.users;
      if (!roomUsers.includes(loginUser)) {
        room.users.push(loginUser);
        room.save();
      }

      io.emit("userList", {
        loginUser: loginUser,
        userList: roomUsers,
      });

      const rooms = await Room.find({ users: loginUser });
      io.emit("roomList", rooms);
    } else {
      socket.emit("roomNotExists", `Room ${roomName} not exists.`);
      console.log(`Room join failed: Room ${roomName} not exists.`);
    }
  });

  socket.on("leaveRoom", async (roomName) => {
    socket.leave(roomName);

    let room = await Room.findOne({ name: roomName });
    room.users = room.users.filter((user) => user !== loginUser);
    room.save();
    console.log(`User left room: ${roomName}`);

    const userList = await User.find().select("username -_id");
    const usernames = userList.map((user) => user.username);
    io.emit("userList", {
      loginUser: loginUser,
      userList: usernames,
    });

    const rooms = await Room.find({ users: loginUser });
    io.emit("roomList", rooms);
  });

  socket.on("sendMessageToRoom", (message, room) => {
    io.to(room).emit("roomMessage", message);
  });

  socket.on("changeChatUser", async (user) => {
    try {
      console.log("ChatUser changed:", user);
      chatUser = user;
      const ml = await Message.find({});
      let messageList = [];
      if (chatUser === allUsers) {
        messageList = await Message.find({
          $or: [{ chatUser: "all users" }],
        });
      } else {
        messageList = await Message.find({
          $or: [
            { chatUser: user, user: loginUser },
            { chatUser: loginUser, user: user },
          ],
        });
      }

      io.emit("messageList", { chatUser: user, messageList });
    } catch (error) {
      console.log("Error changing chat user:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    // You can add additional logic here for when a client disconnects
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
