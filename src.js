import * as Tone from 'tone'
import { ToneAudioNode } from 'tone';
const { Midi } = require('@tonejs/midi')

document.querySelector("button").addEventListener('click', function () {
	document.getElementById("inputs").style.display = "none";
	document.getElementById("loading").style.display = "revert";

	useAPI(document.getElementById("input-url").value.split("/").pop())
});

function useAPI(id) {
	fetch("https://api.streamable.com/videos/" + id)
		.then( res => res.json() )
		.then( data => { 
			var mp4url = data.files.mp4.url
			convertToMP3(mp4url);
			console.log(data.files.mp4.url) 
		});  
}

async function createFile(url, type){
	if (typeof window === 'undefined') return // make sure we are in the browser
	const response = await fetch(url)
	const data = await response.blob()
	const metadata = {
	  type: type || 'video/quicktime'
	}
	return new File([data], url, metadata)
}

import VideoToAudio from 'video-to-audio'

const Ciseaux = require("ciseaux/browser");

var audioLengthFromVideo = 0.3;

async function convertToMP3(input) {
	console.log(createFile(input, 'video/mp4'));
    let sourceVideoFile = await createFile(input, 'video/mp4');
    let targetAudioFormat = 'mp3'
    let convertedAudioDataObj = await VideoToAudio.convert(sourceVideoFile, targetAudioFormat);
	// blobToDataURL(convertedAudioDataObj, function (blob) {
	// 	console.log(blob)
	// })
	console.log(convertedAudioDataObj)
	var dummyVideo = document.createElement("video");
	dummyVideo.src = input;

	dummyVideo.ondurationchange = function() {
		var duration = dummyVideo.duration;
		dummyVideo.ondurationchange = {};

		Ciseaux.context = new AudioContext();

		// create a tape instance from the url
		Ciseaux.from(convertedAudioDataObj.data).then((tape) => {
		// edit tape
		tape = tape.slice(duration - audioLengthFromVideo, duration);
	
		// render the tape to an AudioBuffer
		return tape.render();
		}).then((audioBuffer) => {
			Midi.fromUrl("./2main.mid").then(midi => {
				//the file name decoded from the first track
				//get the tracks
				midi.tracks.forEach(track => {
					//create a synth for each track
					const sampler = new Tone.Sampler({
						urls: {
							"C5": audioBuffer,
						},
						release: 0,
					}).toDestination();
					// const synth = new Tone.Synth().toDestination();
					Tone.loaded().then(() => {
						const player = new Tone.Player("metalcrusher.mp3", () => {
							console.log("asdjkhasdjhgasdkjh");
							document.getElementById("video1").src = input;
							document.getElementById("container").style.display = "none";
							document.getElementById("video-holder").style.display = "flex";
							// document.getElementById("video2").src = input;
							document.getElementById("video1").ondurationchange = function() {
								var duration = document.getElementById("video1").duration;
								document.getElementById("video1").ondurationchange = {};
								setTimeout(() => {
									for (let i = 2; i < document.getElementById("screen-number").valueAsNumber + 1; i++) {
										var newVid = document.createElement("video");
										newVid.src = input;								
										newVid.id = "video" + i
										newVid.muted = true;
										document.getElementById("video-holder").appendChild(newVid);
									}

									console.log(duration)
									player.start();
									player.volume.value = -16;
									document.getElementById("video1").muted = "true";
									document.getElementById("video1").pause();
									// const now = Tone.now() + 0.608
									const now = Tone.now()
									track.notes.forEach(note => {
										var currentNote = null;
										setTimeout(() => {
											for (let i = 1; i < document.getElementById("screen-number").valueAsNumber + 1; i++) {
												var vid = document.getElementById("video" + i);
												if(currentNote != null) continue; 

												var timeOffset = 0.0125;
												if(vid.currentTime >= (duration - audioLengthFromVideo) + timeOffset || vid.paused) {
													console.log("using video " + i);
													if(vid.style.transform == "scale(-1, 1)") {
														vid.style.cssText = "-moz-transform: scale(1, 1); \
														-webkit-transform: scale(1, 1); -o-transform: scale(1, 1); \
														transform: scale(1, 1); filter: revert;";
													} else {
														vid.style.cssText = "-moz-transform: scale(-1, 1); \
														-webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); \
														transform: scale(-1, 1); filter: FlipH;";
													}
													vid.currentTime = duration - audioLengthFromVideo;
													vid.pause();
													vid.play();
													currentNote = note;
												}
											}
											// } else {
											// 	if(document.getElementById("video2").style.transform == "scale(-1, 1)") {
											// 		document.getElementById("video2").style.cssText = "-moz-transform: scale(1, 1); \
											// 		-webkit-transform: scale(1, 1); -o-transform: scale(1, 1); \
											// 		transform: scale(1, 1); filter: revert;";
											// 	} else {
											// 		document.getElementById("video2").style.cssText = "-moz-transform: scale(-1, 1); \
											// 		-webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); \
											// 		transform: scale(-1, 1); filter: FlipH;";
											// 	}
											// 	document.getElementById("video2").currentTime = duration - audioLengthFromVideo;
											// 	document.getElementById("video2").pause();
											// 	document.getElementById("video2").play();
											// }
											console.log(note.time)
										// }, (note.time + 0.608) * 1000);
										}, (note.time) * 1000);
										sampler.triggerAttackRelease(note.name, note.duration, note.time + now, note.velocity)
									})		
								}, (duration - audioLengthFromVideo) * 1000);
							};
							console.log(duration);
						}).toDestination();
					});
				})
			})
		})
	}
}