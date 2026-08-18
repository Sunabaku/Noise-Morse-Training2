const playbtn = document.getElementById("playBtn");
const morseVolumeSlider = document.getElementById("morseVolumeSlider")
const noiseVolumeSlider = document.getElementById("noiseVolumeSlider")
const wpmSettingInput = document.getElementById("wpmSetting")
const frequencySettingInput = document.getElementById("frequencySetting")
const userAnsInput = document.getElementById("userAnsInput")
const ansSubmitButton = document.getElementById("submitButton")
const userAnsDisplay = document.getElementById("userAnsDisplay")
const ansDisplay = document.getElementById("ansDisplay")
const startButton = document.getElementById("startButton")
const answerDisplayGroup = document.getElementById("answerDisplayGroup")
const restartButton = document.getElementById("restartButton")
const trainingGroup = document.getElementById("trainingGroup")
const settingGroup = document.getElementById("settings")
const nextButton = document.getElementById("nextButton")
const resultGroup = document.getElementById("resultGroup")

const dotDuration = 0.06;
const dashDuration = dotDuration * 3; //初期値 20wpmでの数値

let wpm = 20;

const problemNum = 5;
let currentProblemNum = 0; //今何問目か
let correctAnsNum = 0; //正解数

const morseDict = {
    "A": ".-",
    "B": "-...",
    "C": "-.-.",
    "D": "-..",
    "E": ".",
    "F": "..-.",
    "G": "--.",
    "H": "....",
    "I": "..",
    "J": ".---",
    "K": "-.-",
    "L": ".-..",
    "M": "--",
    "N": "-.",
    "O": "---",
    "P": ".--.",
    "Q": "--.-",
    "R": ".-.",
    "S": "...",
    "T": "-",
    "U": "..-",
    "V": "...-",
    "W": ".--",
    "X": "-..-",
    "Y": "-.--",
    "Z": "--..",
    //"/": "-..-.",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "0": "-----"
};

const morseNumDict = {
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "0": "-----"
};

let frequency = 600;
let currentMorseVolume = 0.3;
let currentNoiseVolume = 0.3;

let audioCtx = null;
let noiseNode = null;

let userAnswer = "";
let answer = "qqqqqq";

let morse = null;
let duration = 0; //信号の長さ(s)

morseVolumeSlider.addEventListener("input" , (e)=>{
    currentMorseVolume = parseFloat(e.target.value);
});

noiseVolumeSlider.addEventListener("input",(e)=>{
    currentNoiseVolume = parseFloat(e.target.value);
});

ansSubmitButton.addEventListener("click",()=>{ //解答提出時処理
    answerDisplayGroup.classList.remove("hidden");
    userAnswer = userAnsInput.value.toUpperCase();
    if(JudgeAns(answer,userAnswer)){
        correctAnsNum++;
    }
    userAnsDisplay.textContent = userAnswer
    ansDisplay.textContent = answer;
    userAnsInput.value = "";
    ansSubmitButton.classList.add("hidden");
})
function JudgeAns(ans,userAns){
    if(ans===userAns){
        return true;
    }
    else{
        return false;
    }
}

startButton.addEventListener("click",()=>{ //開始時処理
    settingGroup.classList.add("hidden");
    trainingGroup.classList.remove("hidden");

    wpm = wpmSettingInput.value;
    frequency = frequencySettingInput.value;

    morse = GenerateMorse(6);
})

nextButton.addEventListener("click",()=>{ //次の問題に進むときの処理
    answerDisplayGroup.classList.add("hidden");
    ansSubmitButton.classList.remove("hidden");
    morse = GenerateMorse(6);
    currentProblemNum++;

    if(currentProblemNum >= problemNum){
        resultGroup.classList.remove("hidden");
        answerDisplayGroup.classList.add("hidden");
        trainingGroup.classList.add("hidden");

        document.getElementById("resultNum").textContent = correctAnsNum;
    }
})

restartButton.addEventListener("click",()=>{ //リスタート時の処理(リロード)
    location.reload();
})

async function HandlePlayClick() {
    if(!audioCtx){
        audioCtx = new (window.AudioContext);
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    
    console.log(wpmSettingInput.value);
    playbtn.disabled = true;

    const duration = PlayMorseCode(morse[0]);
    answer = morse[1];

    PlayNoise();
    console.log(morse);

    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    playbtn.disabled = false;
    StopNoise();
}
playbtn.addEventListener("click",HandlePlayClick);

function playTone(duration, starttime){
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency,starttime);

    gainNode.gain.setValueAtTime(0,starttime);
    gainNode.gain.linearRampToValueAtTime(currentMorseVolume,starttime + 0.005);
    gainNode.gain.setValueAtTime(currentMorseVolume, starttime + duration - 0.005);
    gainNode.gain.linearRampToValueAtTime(0, starttime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(starttime);
    oscillator.stop(starttime + duration);
}

function PlayNoise(){
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for(i=0; i<bufferSize; i++){
        output[i] = (Math.random() * 2 - 1) * currentNoiseVolume;
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.8;
    
    noiseSource.connect(noiseGain);
    noiseGain.connect(audioCtx.destination); 

    noiseSource.start();
    noiseNode = noiseSource;
}
function StopNoise(){
    if(noiseNode){
        noiseNode.stop();
        noiseNode = null;
    }
}

function PlayMorseCode(codeString){
    const fixedDotDuration = dotDuration * 20 / wpm;
    const fixedDashDuration = dashDuration * 20 / wpm;
    const pause = fixedDotDuration;

    const starttime = audioCtx.currentTime;
    let time = audioCtx.currentTime + 0.05;

    for(const char of codeString){
        if(char == "."){
            playTone(dotDuration, time);
            time += dotDuration + pause;
        }
        else if(char == "-"){
            playTone(dashDuration, time);
            time += dashDuration + pause;
        }
        else if(char == " "){
            time += dotDuration * 2;
        }
        else{
            console.warn("モールス信号への変換が不正です");
        }
    }

    return (time + dashDuration) - starttime;
}

function GenerateMorse(length=6){
    const dictSize = Object.keys(morseDict).length;
    const numDictSize = Object.keys(morseNumDict).length;

    let morse = ["          ",""]; //再生開始を遅らせるためにスペースを挿入

    const values = Object.values(morseDict);
    const keys = Object.keys(morseDict);

    const numValues = Object.values(morseNumDict);
    const numKeys = Object.keys(morseNumDict);

    for(let i=0; i<length; i++){
        switch(i){
            case 0:
            case 1:
                const firstIndex = Math.floor(Math.random() * dictSize);
                const key = keys[firstIndex];
                if(key == "Q" || key == "0" || key == "1"){
                    i--;
                    continue;
                }
                morse[0] += values[firstIndex] + " ";
                morse[1] += keys[firstIndex];
                break;
                console.log("0 or 1 section called")
            case 2:
                const numIndex = Math.floor(Math.random() * numDictSize);
                morse[0] += numValues[numIndex] + " ";
                morse[1] += numKeys[numIndex];
                break;
            default:
                const normalIndex = Math.floor(Math.random() * dictSize);
                morse[0] += values[normalIndex] + " ";
                morse[1] += keys[normalIndex];
        }
    }
    return morse;
}