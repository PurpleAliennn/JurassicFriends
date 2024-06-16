import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import {flattenAndLabelData, flattenArray, machine } from './training.js'

let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
let handTrainButton = false;
let openHandButton = false;
let dinoHandButton = false;
let classifyButton = false;
let trainingsData = [];

document.getElementById("handTrainButton").addEventListener("click", () => {
    handTrainButton = true
})

document.getElementById("openHandButton").addEventListener("click", () => {
    openHandButton = true
})

document.getElementById("dinoHandButton").addEventListener("click", () => {
    dinoHandButton = true
})

document.getElementById("learnButton").addEventListener("click", () => {
    for (const line of trainingsData) {
        machine.learn(line.pose, line.label)
    }

    const jsonData = JSON.stringify(trainingsData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
})  

document.getElementById("classifyButton").addEventListener("click", () => {
    classifyButton = true
})


const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 1
    });
};


createHandLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

const hasGetUserMedia = () => { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };


if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
    if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
    
    const constraints = {
        video: true
    };
   
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}
let lastVideoTime = -1;
let results = undefined;
console.log(video);
async function predictWebcam() {
    canvasElement.style.width = video.videoWidth;
    ;
    canvasElement.style.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = handLandmarker.detectForVideo(video, startTimeMs);
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.landmarks) {
        
        for (const landmarks of results.landmarks) {

            if(handTrainButton){
                trainingsData.push(flattenAndLabelData(landmarks, "thumbsUp"));
                console.log(trainingsData);
                handTrainButton = false;
            }

            if(openHandButton){
                trainingsData.push(flattenAndLabelData(landmarks, "openHand"));
                console.log(trainingsData);
                openHandButton = false;
            }

            if(dinoHandButton){
                trainingsData.push(flattenAndLabelData(landmarks, "dinoHand"));
                console.log(trainingsData);
                dinoHandButton = false;
            }

            if(classifyButton){
                console.log(flattenArray(landmarks));
                console.log(machine.classify(flattenArray( landmarks)));
                classifyButton = false;
            }

            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#000000",
                lineWidth: 5
            });

            drawLandmarks(canvasCtx, landmarks, { color: "#0000FF", lineWidth: 2 });

        }
    }
    canvasCtx.restore();
    
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}