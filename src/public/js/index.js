const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nickName");

const socket = new WebSocket(`ws://${window.location.host}`);
// 클라이언트의 socket은 서버와의 연결을 의미한다.

const makeMessage = (type, payload) => {
  const message = { type, payload };
  return JSON.stringify(message);
};

socket.addEventListener("open", () => {
  console.log("Server Connected");
});

socket.addEventListener("message", (message) => {
  const div = document.createElement("div");
  messageList.append(div);
  div.textContent = message.data;
});

socket.addEventListener("close", () => {
  console.log("Server Disconnected ");
});

const handleSubmit = (e) => {
  e.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMessage("new_message", input.value));
  input.value = "";
};

const handleNickSubmit = (e) => {
  e.preventDefault();
  const input = nickForm.querySelector("input");
  socket.send(makeMessage("nickName", input.value));
};

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);
// 서버에서 보낸

/* 

클라에서 socket.send는 서버로 전송 되고

*/
