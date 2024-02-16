# Simple multi-user chat application

1. First commit within 1h.
2. Focus on basic functions first.
3. Work done after 1h is strong plus.
4. Back-end can be REST or Websockets based.
5. Front-end React.
6. Logon can be just username. 
7. Password authentication is optional.

## Priority:

### Basic Requirement:

Simple logon

Show list of users connected

Send message to single user

Send message to all users

### Plus Requirement:

Clear guide to run the solution

Message history

Authentication (Password)

Websocket

Persistence

Chat rooms

## How to run:

### DB:

```
brew tap mongodb/brew

brew install mongodb-community

brew services start mongodb-community

```


### backend:


```
cd backend

npm install

node server.js

```

### frontend:


```
cd chat-app

npm install

npm start
```

### Browser

```
http://localhost:3000
```

### Register User and password

```
  Aleksandr: "password123"
  David: "password456"
  Mohanad: "password789"

```
