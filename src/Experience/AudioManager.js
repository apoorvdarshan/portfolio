import { AudioListener, Audio } from "three";
import Experience from "./Experience.js";

export default class AudioManager {
  constructor() {
    this.experience = new Experience();
    this.resources = this.experience.resources;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera.instance;
    this.audioButton = document.querySelector(".audio-button");
    this.isMuted = false;
    this.hasStarted = false;
    this.activeSounds = [];

    // Single shared AudioListener for all sounds
    this.listener = new AudioListener();
    this.camera.add(this.listener);

    this.setAudioManager();
  }

  setAudioManager() {
    this.audioButton.addEventListener("click", () => {
      if (this.audioButton.classList.contains("audio-button-muted")) {
        this.isMuted = false;
        this.unmuteAudios();
        this.audioButton.classList.remove("audio-button-muted");
      } else {
        this.isMuted = true;
        this.muteAudios();
        this.audioButton.classList.add("audio-button-muted");
      }
    });
  }

  muteAudios() {
    this.activeSounds.forEach((audioElement) => {
      audioElement.sound.setVolume(0);
    });
  }

  unmuteAudios() {
    this.activeSounds.forEach((audioElement) => {
      audioElement.sound.setVolume(audioElement.volume);
    });
  }

  playSingleAudio(audioName, volume) {
    if (this.isMuted) {
      return;
    }
    const buffer = this.resources.items[audioName];
    if (!buffer) {
      console.warn(`Audio buffer not found: ${audioName}`);
      return;
    }

    const sound = new Audio(this.listener);
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(volume);
    sound.play();

    const audioElement = { sound, volume };
    this.activeSounds.push(audioElement);

    sound.source.onended = () => {
      this.removeSound(audioElement);
    };
  }

  playLoopAudio(audioName, volume) {
    const buffer = this.resources.items[audioName];
    if (!buffer) {
      console.warn(`Audio buffer not found: ${audioName}`);
      return;
    }

    const sound = new Audio(this.listener);
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(this.isMuted ? 0 : volume);
    sound.play();

    const audioElement = { sound, volume };
    this.activeSounds.push(audioElement);
  }

  removeSound(audioElement) {
    const index = this.activeSounds.indexOf(audioElement);
    if (index !== -1) {
      this.activeSounds.splice(index, 1);
    }
    if (audioElement.sound) {
      audioElement.sound.disconnect();
    }
  }

  stopAllSounds() {
    this.activeSounds.forEach((audioElement) => {
      if (audioElement.sound.isPlaying) {
        audioElement.sound.stop();
      }
      audioElement.sound.disconnect();
    });
    this.activeSounds = [];
  }

  destroy() {
    this.stopAllSounds();
    this.camera.remove(this.listener);
  }
}
