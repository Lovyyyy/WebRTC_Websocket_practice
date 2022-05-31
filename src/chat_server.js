import express from "express";
import http from "http";
import SocketIO from "socket.io";
// import WebSocket from "ws";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);
const httpServer = http.createServer(app);
const io = SocketIO(httpServer);
// const wsServer = new WebSocket.Server({ httpServer });

const publicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  // const sids = io.sockets.adapter.sids;
  // const rooms = io.sockets.adapter.rooms;
  // 두 개의 선언은 위의 객체 구조분해 할당으로 처리도 가능
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
    //  rooms 목록 중 개인 고유 소켓을 제외한 나머지 값들만 추출
  });
  return publicRooms;
};

const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
};

io.on("connection", (socket) => {
  socket.nickname = "익명";
  socket.onAny((event) => {
    console.log(`SOCKET EVENT : ${event}`);
  });
  // socket.onAny 는 소켓에서 발생하는 어떠한 이벤트도 console을 통해 추적 함

  socket.on("room", (roomName, inputText) => {
    console.log("socket.id : " + socket.id);
    socket.join(roomName);
    console.log(socket.rooms);
    inputText();

    socket.to(roomName).emit("hello", socket.nickname, countRoom(roomName));
    // roomName 방에 있는 모두에게 join 이벤트를 실행.
    io.sockets.emit("room_change", publicRooms());
    // publicRooms에 "room_change" 이벤트 실행
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1);
    });
  });

  socket.on("disconnect", () => {
    io.sockets.emit("room_change", publicRooms());
  });

  socket.on("new_message", (message, room, sendingMessage) => {
    socket.to(room).emit("new_message2", `${socket.nickname}:${message}`);
    sendingMessage();
  });
  /*socket.on("disconnecting", function )  
  소켓의 연결이 끊어질때 발생하는 이벤트라고 보면 될 듯
  socket.rooms 는 socket이 속해있는 방의 목록을 나타내며, 
  소속 된 모든 방들에 개별적으로 bye 이벤트를 실행  */

  socket.on("setNickname", (nickname) => (socket.nickname = nickname));
});

httpServer.listen(3000, handleListen);

/*

// WebSocket 서버에 http 서버를 넣어줌으로써 WebSocket 서버와 http 서버를 동시에 기동 가능함 (optional)
// webSocket 서버에 http 서버를 넣으면 동일한 포트에서 http / ws 프로토콜 모두 사용 가능

const sockets = [];
wsServer.on("connection", (socket) => {
  sockets.push(socket);
  socket.nickname = "ㅇㅇ";
  // sockets 배열에 socket(브라우저) 를 넣어줌
  console.log("Connected server");

  socket.on("close", () => {
    console.log("Browser Disconnected");
  });

  socket.on("message", (message) => {
    const messageString = message.toString();
    const parsedMessage = JSON.parse(messageString);
    switch (parsedMessage.type) {
      case "new_message":
        sockets.forEach((browser) => browser.send(`${socket.nickname} : ${parsedMessage.payload}`));
      case "nickName":
        socket.nickname = parsedMessage.payload;
    }

    // 하단의 if문은 위의 switch 문으로 변경 할 수 있다.

    // if (parsedMessage.type === "new_message") {
    //   sockets.forEach((browser) => browser.send(`${socket.nickname} : ${parsedMessage.payload}`));
    // } else if (parsedMessage.type === "nickName") {
    //   socket.nickname = parsedMessage.payload;
    // }

    // socket.send(messageString);
    console.log(JSON.parse(messageString));
  });
});

//server의 socket 객체는 연결 된 브라우저를 의미한다.

server.listen(3000, handleListen);

*/
