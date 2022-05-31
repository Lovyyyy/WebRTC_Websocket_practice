const socket = io();

const myFace = document.querySelector("#myFace");
const mutebtn = document.querySelector("#mute");
const camerabtn = document.querySelector("#camera");
const cameraSelector = document.querySelector("#cameras");
const audioSelector = document.querySelector("#audios");

const call = document.querySelector("#call");

call.hidden = true;

let myStream;
let muted = false;
let cameraoff = false;
let roomName;
let myPeerConnection;

const getMedia = async (deviceId) => {
  const inistalConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstrains = {
    audio: { deviceId: deviceId },
    video: { deviceId: deviceId },
  };

  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : inistalConstrains
    );
    myFace.srcObject = myStream;
  } catch (e) {
    console.log(e);
  }
};
getMedia();

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    // const currentVideo = myStream.getVideoTracks();
    // console.log(currentVideo);
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.textContent = camera.label;
      // if (currentVideo.label === video.label) {
      // option.selected = true;
      // }

      cameraSelector.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
};
getCameras();

const getAudios = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audios = devices.filter((device) => device.kind === "audioinput");
    // const currentAudio = myStream.getAudioTracks();
    // console.log(currentAudio);
    audios.forEach((audio) => {
      const option = document.createElement("option");
      option.value = audio.deviceId;
      option.textContent = audio.label;
      // if (currentAudio.label === audio.label) {
      // option.selected = true;
      // }
      audioSelector.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
};
getAudios();

const handleMuteClick = () => {
  myStream.getAudioTracks().forEach((element) => (element.enabled = !element.enabled));
  if (!muted) {
    mutebtn.textContent = "음소거 해제";
    muted = true;
  } else {
    mutebtn.textContent = "음소거";
    muted = false;
  }
};

const handleCameraClick = () => {
  myStream.getVideoTracks().forEach((element) => (element.enabled = !element.enabled));
  if (!cameraoff) {
    camerabtn.textContent = "카메라 켜기";
    cameraoff = true;
  } else {
    camerabtn.textContent = "카메라 끄기";
    cameraoff = false;
  }
};

// !RTC CODE

const handleIce = (data) => {
  socket.emit("ice", data.candidate, roomName);
};

const handleAddStream = (data) => {
  const peerStream = document.querySelector("#peersStream");
  peerStream.srcObject = data.stream;
};

const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
};
// 새로운 peer-to-peer 연결을 만들고, 브라우저에서 비디오/오디오 장치 정보를 각각 연결에 넣어 줌

//! ======== Welcome
const welcome = document.querySelector("#welcome");
const welcomeForm = welcome.querySelector("form");

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
};

const handleWelcomeSubmit = async (e) => {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
};

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//! socekt Code

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", roomName, offer);
});
// 브라우저 A에서 실행 됨.
// offer를 보낸다.

socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", roomName, answer);
});
// 브라우저 B에서 실행
// offer를 RemoteDescription 하고 answer를 만들고 answer를 setLocalDescription 한다.

socket.on("answer", async (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});
// 브라우저 A는 다시 answer를 setRemoteDescription 해서

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

/*
offer / answer를 끝내면 IceCandidate 이벤트가 발생
IceCandidate > 브라우저끼리 서로 소통 할 수 있게 해주는 이벤트
양 측 브라우저에서 최선의 방법을 선택할때까지 진행, 

https://developer.mozilla.org/ko/docs/Web/API/RTCIceCandidate

*/
const handleCameraSelect = async () => {
  await getMedia(cameraSelector.value);
  if (myPeerConnection) {
    console.log(myPeerConnection.getSenders());
  }
};
const handleAudioaSelect = async () => {
  await getMedia(audioSelector.value);
  if (myPeerConnection) {
    const audioTrack = myStream.getAudioTracks()[0];
    const audiosender = myPeerConnection.getSenders().find((sender) => {
      if (sender.track.kind === "audio") {
        return sender;
      }
    });
    audiosender.replaceTrack(audioTrack);
  }
};

mutebtn.addEventListener("click", handleMuteClick);
camerabtn.addEventListener("click", handleCameraClick);
cameraSelector.addEventListener("input", handleCameraSelect);
audioSelector.addEventListener("input", handleAudioaSelect);
