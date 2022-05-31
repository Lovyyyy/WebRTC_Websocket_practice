const socket = io();

const lobby = document.querySelector("#lobby");
const form = lobby.querySelector("form");
const room = document.querySelector("#room");
const messageForm = room.querySelector("#message");
const nameForm = room.querySelector("#nickname");

room.hidden = true;
// socket.io를 프론트에 적용 , 자동으로 socket.io 를 사용하는 서버에 연결 함   -
let roomName = "";

const inputText = () => {
  lobby.hidden = true;
  room.hidden = false;
  const h2 = room.querySelector("h2");
  h2.textContent = `Room : ${roomName}`;
};
// css가 아니라 js로도 히든 정도는 바로 처리가 되는구만..

const handleRoomSubmit = (e) => {
  e.preventDefault();
  const input = form.querySelector("input");
  socket.emit("room", input.value, inputText);
  roomName = input.value;
  input.value = "";
};
form.addEventListener("submit", handleRoomSubmit);

/*
  socket.emit과 socket.send 의 차별점
  websocket의 send 메소드는 message만 전달 할 수 있으며, 그 값은 string으로만 가능 했음
  socketIo 에서 emit 메소드는 첫 인자는 발생 될 이벤트의 이름을 string // symbol로써 전달
  이후 인자들은 타입과 관계 없이 사용 및 서버로 전달이 가능하며, 
  함수가 들어가는 경우에는 마지막 인자로 들어 가며 프론트에서 생성한 함수를 서버측에서 인자로 받을 수 있음.
  인자로 받은 함수는 서버에서 실행시키는게 아니며, 실제 실행은 클라이언트에서 실행 됨
  서버로 전달 된 함수를 서버에서 실행하는 경우, 함수의 실행과 인자 정보를 클라이언트로 전달 한다고 보면 될 듯
  */

const handleMessageSubmit = (e) => {
  e.preventDefault();
  const input = room.querySelector("#message input");
  const value = input.value;
  socket.emit("new_message", value, roomName, () => {
    sendingMessage(`YOU:${value}`);
  });
  input.value = "";
};
// function handleMessageSubmit(e) {
// e.preventDefault();
// const input = room.querySelector("input");
// const value = input.value;
// socket.emit("new_message", input.value, roomName, () => {
// sendingMessage(`YOU:${value}`);
// });
// input.value = "";
// }
// 호이스팅이 되는게 편하긴 해 ~

const handleNicknameSubmit = (e) => {
  e.preventDefault();
  const input = room.querySelector("#nickname input");
  socket.emit("setNickname", input.value);
};

const sendingMessage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  ul.appendChild(li);
  li.textContent = message;
};

socket.on("hello", (user, newCount) => {
  const h2 = room.querySelector("h2");
  h2.textContent = `Room : ${roomName} : ${newCount}`;
  sendingMessage(`${user} 님이 입장하셨습니다.`);
});
// 서버에서 진행되는 hello 이벤트

socket.on("bye", (user, newCount) => {
  const h2 = room.querySelector("h2");
  h2.textContent = `Room : ${roomName} : ${newCount}`;
  sendingMessage(`${user} 님이 퇴장하셨습니다.`);
});
// 서버에서 진행되는 bye 이벤트

socket.on("new_message2", sendingMessage);

socket.on("room_change", console.log);
// socket.on("room_change", (msg) => {console.log(msg)});
// 같은 코드

socket.on("room_change", (rooms) => {
  const roomList = lobby.querySelector("ul");
  roomList.textContent = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((element) => {
    const li = document.createElement("li");
    roomList.append(li);
    li.textContent = element;
  });
});

messageForm.addEventListener("submit", handleMessageSubmit);
nameForm.addEventListener("submit", handleNicknameSubmit);
