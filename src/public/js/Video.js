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
    mutebtn.textContent = "????????? ??????";
    muted = true;
  } else {
    mutebtn.textContent = "?????????";
    muted = false;
  }
};

const handleCameraClick = () => {
  myStream.getVideoTracks().forEach((element) => (element.enabled = !element.enabled));
  if (!cameraoff) {
    camerabtn.textContent = "????????? ??????";
    cameraoff = true;
  } else {
    camerabtn.textContent = "????????? ??????";
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
// ????????? peer-to-peer ????????? ?????????, ?????????????????? ?????????/????????? ?????? ????????? ?????? ????????? ?????? ???

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
// ???????????? A?????? ?????? ???.
// offer??? ?????????.

socket.on("offer", async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", roomName, answer);
});
// ???????????? B?????? ??????
// offer??? RemoteDescription ?????? answer??? ????????? answer??? setLocalDescription ??????.

socket.on("answer", async (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});
// ???????????? A??? ?????? answer??? setRemoteDescription ??????

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

/*
offer / answer??? ????????? IceCandidate ???????????? ??????
IceCandidate > ?????????????????? ?????? ?????? ??? ??? ?????? ????????? ?????????
??? ??? ?????????????????? ????????? ????????? ?????????????????? ??????, 

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
