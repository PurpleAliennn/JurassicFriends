import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import {flattenAndLabelData, flattenArray, machine } from './training_attributes/training.js'

let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
let classifyButton = false;
let dataLoaded = false;
let enemyEasySpawn = false;
let enemyDifficultSpawn = false;
let currentEnemyUrl = false
let timeoutActive = false

async function loadData(){
    fetch('./data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // const formattedJSON = JSON.parse(data);
            // console.log(typeof data);
            for (const line of data) {
                // console.log(line);
                machine.learn(line.pose, line.label)
            }

        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

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
        enableWebcamButton.innerText = "Start playing";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "Stop playing";
    }
    
    const constraints = {
        video: true
    };
   
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

function getRandomEnemy() {
    enemyDifficultSpawn = false
    enemyEasySpawn = false
    if (Math.random() > 0.5) {
        currentEnemyUrl = './dinoSprite.png'
        enemyEasySpawn = true
    } else {
        enemyDifficultSpawn = true
        currentEnemyUrl = './otherDinoSprite.jpeg'
    }

}

getRandomEnemy()

let lastVideoTime = -1;
let results = undefined;

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

    const backgroundImage = new Image()
    backgroundImage.src = './backgroundImage.png'
    canvasCtx.drawImage(backgroundImage,0,0,canvasElement.width, canvasElement.height)

    if (currentEnemyUrl) {


        const image = new Image()
        image.src = currentEnemyUrl
        canvasCtx.drawImage(image,250,220,300, 200)
    } else {
        getRandomEnemy()
    }

    if (results.landmarks) {
        
        for (const landmarks of results.landmarks) {
            if(!dataLoaded) {
                loadData()
                dataLoaded = true
            }

            if(classifyButton){
                classifyButton = false;
            } 

            let label = machine.classify(flattenArray( landmarks))

            if (!timeoutActive) {
                timeoutActive = true
                console.log('start timer...');
                setTimeout(() => {
                    timeoutActive = false

                    if ((enemyEasySpawn && label == "thumbsUp") || (enemyDifficultSpawn && label == "openHand")) {
                        console.log('yay');
                        alert('You managed to calm the dinosaur down! well done:)')
                        currentEnemyUrl = false;
                        getRandomEnemy()
                    } else {
                        console.log('ur ded');
                        alert('You made the wrong hand gesture :( it startled the dinosaur')
                    }

                }, 5000);
            }


            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#4F7942",
                lineWidth: 5
            });

            drawLandmarks(canvasCtx, landmarks, { color: "#669c56", lineWidth: 1 });

        }

    }
    canvasCtx.restore();
    
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}