class HorrorTV {
  constructor() {
    this.currentChannel = 1;
    this.channels = document.querySelectorAll(".channel");
    this.channelButtons = document.querySelectorAll(".channel-btn");
    this.staticOverlay = document.querySelector(".static-overlay");
    this.screen = document.querySelector(".screen");
    this.audioContext = null;
    this.staticNoise = null;
    this.isAudioEnabled = false;

    this.init();
  }

  init() {
    this.setupChannelSwitching();
    this.setupSwipeNavigation();
    this.setupAudio();
    this.startGlitchEffects();
    this.setupTypewriterEffect();
    this.setupCursorTracking();
    this.setupSecretChannel();
    this.preloadEffects();

    // Auto-start some ambient effects
    setTimeout(() => this.randomScreenFlicker(), 5000);
    setInterval(() => this.randomStaticBurst(), 15000);
  }

  setupChannelSwitching() {
    this.channelButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const channelId = e.target.dataset.channel;
        // Handle both numeric and non-numeric channels
        const channelNum = isNaN(parseInt(channelId))
          ? channelId
          : parseInt(channelId);
        this.switchToChannel(channelNum);
      });
    });

    // Navigation buttons
    document.addEventListener("click", (e) => {
      if (e.target.closest(".prev-btn")) {
        e.preventDefault();
        this.prevChannel();
      } else if (e.target.closest(".next-btn")) {
        e.preventDefault();
        this.nextChannel();
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= 9) {
        this.switchToChannel(key);
      }
      if (e.key === "0") {
        this.switchToChannel("0");
      }
      if (e.key === "*") {
        this.switchToChannel("*");
      }
      if (e.key === "/") {
        this.switchToChannel("/");
      }

      // Arrow key navigation
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        this.nextChannel();
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        this.prevChannel();
      }

      // Secret key combinations
      if (e.key === "Escape") {
        this.emergencyShutdown();
      }
    });
  }

  setupSwipeNavigation() {
    // Only enable swipe navigation on screens under 1200px
    if (window.innerWidth >= 1200) return;

    const screenBezel = document.querySelector(".screen-bezel");
    if (!screenBezel) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isSwipeActive = false;

    // Touch start
    screenBezel.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = Date.now();
        isSwipeActive = true;

        // Add visual feedback
        screenBezel.style.transition = "transform 0.1s ease";
        screenBezel.style.transform = "scale(0.98)";
      },
      { passive: false }
    );

    // Touch move
    screenBezel.addEventListener(
      "touchmove",
      (e) => {
        if (!isSwipeActive) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        // If horizontal swipe is dominant, prevent vertical scrolling
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
          e.preventDefault();

          // Visual feedback during swipe
          const swipeProgress = Math.min(Math.abs(deltaX) / 100, 1);
          const rotation = (deltaX / 100) * 2; // Slight rotation effect
          screenBezel.style.transform = `scale(0.98) rotateY(${rotation}deg)`;
        }
      },
      { passive: false }
    );

    // Touch end
    screenBezel.addEventListener(
      "touchend",
      (e) => {
        if (!isSwipeActive) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const deltaTime = Date.now() - startTime;

        // Reset visual feedback
        screenBezel.style.transform = "";
        screenBezel.style.transition = "";

        // Swipe thresholds
        const minSwipeDistance = 50;
        const maxSwipeTime = 500;
        const maxVerticalDistance = 100;

        // Check if it's a valid horizontal swipe
        if (
          Math.abs(deltaX) > minSwipeDistance &&
          Math.abs(deltaY) < maxVerticalDistance &&
          deltaTime < maxSwipeTime
        ) {
          // Add swipe effect
          this.createSwipeEffect(deltaX > 0 ? "right" : "left");

          // Navigate channels
          if (deltaX > 0) {
            // Swipe right - previous channel
            this.prevChannel();
          } else {
            // Swipe left - next channel
            this.nextChannel();
          }
        }

        isSwipeActive = false;
      },
      { passive: false }
    );

    // Touch cancel
    screenBezel.addEventListener("touchcancel", () => {
      screenBezel.style.transform = "";
      screenBezel.style.transition = "";
      isSwipeActive = false;
    });

    // Handle orientation changes and window resizing
    window.addEventListener("resize", () => {
      // Re-check if we should disable swipe on larger screens
      if (window.innerWidth >= 1200) {
        isSwipeActive = false;
      }
    });
  }

  createSwipeEffect(direction) {
    const screen = document.querySelector(".screen");
    if (!screen) return;

    // Create swipe indicator
    const swipeIndicator = document.createElement("div");
    swipeIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      ${direction === "left" ? "right: 20px" : "left: 20px"};
      transform: translateY(-50%);
      color: #00ff41;
      font-size: 24px;
      text-shadow: 0 0 10px #00ff41;
      pointer-events: none;
      z-index: 25;
      animation: swipeIndicator 0.6s ease-out forwards;
    `;

    swipeIndicator.innerHTML = direction === "left" ? "◄" : "►";
    screen.appendChild(swipeIndicator);

    // Add CSS animation keyframes if not already added
    if (!document.querySelector("#swipe-animations")) {
      const style = document.createElement("style");
      style.id = "swipe-animations";
      style.textContent = `
        @keyframes swipeIndicator {
          0% {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) translateX(${
              direction === "left" ? "-30px" : "30px"
            });
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove indicator after animation
    setTimeout(() => {
      if (swipeIndicator.parentNode) {
        swipeIndicator.remove();
      }
    }, 600);
  }

  switchToChannel(channelNum) {
    console.log(
      `Switching to channel: ${channelNum} (type: ${typeof channelNum})`
    );
    if (channelNum === this.currentChannel) return;

    // Stop horror video when leaving channel 7
    if (this.currentChannel === 7) {
      this.stopHorrorVideo();
    }

    this.playChannelSwitchSound();
    this.channelSwitchEffect(() => {
      // Update active states
      this.channels.forEach((channel) => channel.classList.remove("active"));
      this.channelButtons.forEach((btn) => btn.classList.remove("active"));

      // Set new active channel
      const newChannel = document.querySelector(
        `.channel[data-channel="${channelNum}"]`
      );
      const newButton = document.querySelector(
        `.channel-btn[data-channel="${channelNum}"]`
      );

      if (newChannel && newButton) {
        newChannel.classList.add("active");
        newButton.classList.add("active");
        this.currentChannel = channelNum;

        // Special effects for certain channels
        this.handleSpecialChannelEffects(channelNum);
      } else if (newButton) {
        // If button exists but no channel content yet, just highlight the button
        newButton.classList.add("active");
        this.currentChannel = channelNum;
        console.log(`Channel ${channelNum} - Coming Soon!`);
      }
    });
  }

  nextChannel() {
    // All available channels in order
    const channels = [1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "/"];
    const currentIndex = channels.indexOf(this.currentChannel);

    if (currentIndex !== -1) {
      // Go to next channel, or wrap to first if at end
      const nextIndex = (currentIndex + 1) % channels.length;
      this.switchToChannel(channels[nextIndex]);
    } else {
      // If current channel not found, go to first channel
      this.switchToChannel(1);
    }
  }

  prevChannel() {
    // All available channels in order
    const channels = [1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "/"];
    const currentIndex = channels.indexOf(this.currentChannel);

    if (currentIndex !== -1) {
      // Go to previous channel, or wrap to last if at beginning
      const prevIndex =
        currentIndex === 0 ? channels.length - 1 : currentIndex - 1;
      this.switchToChannel(channels[prevIndex]);
    } else {
      // If current channel not found, go to last channel
      this.switchToChannel("/");
    }
  }

  channelSwitchEffect(callback) {
    // Intense static during channel switch
    this.staticOverlay.style.opacity = "0.8";
    this.screen.style.filter = "blur(2px) brightness(1.5)";

    // Static burst effect
    this.createStaticBurst();

    setTimeout(() => {
      callback();

      // Fade back to normal
      setTimeout(() => {
        this.staticOverlay.style.opacity = "";
        this.screen.style.filter = "";
      }, 200);
    }, 300);
  }

  handleSpecialChannelEffects(channelNum) {
    switch (channelNum) {
      case 1: // Intro channel
        this.triggerWelcomeEffect();
        break;
      case 7: // Horror video channel
        this.triggerHorrorVideo();
        break;
      case "*": // Contact channel
        this.triggerContactWarning();
        break;
      case "/": // Secret channel
        this.triggerSecretChannelEffects();
        break;
    }
  }

  setupAudio() {
    // Initialize Web Audio API for static effects
    document.addEventListener(
      "click",
      () => {
        if (!this.isAudioEnabled) {
          this.initAudioContext();
        }
      },
      { once: true }
    );
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.isAudioEnabled = true;
      this.createStaticNoiseBuffer();
    } catch (error) {
      console.log("Audio not supported");
    }
  }

  createStaticNoiseBuffer() {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 0.1; // 0.1 seconds
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1; // Low volume static
    }

    this.staticNoise = buffer;
  }

  playChannelSwitchSound() {
    if (!this.audioContext || !this.staticNoise) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = this.staticNoise;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.1
    );

    source.start();
    source.stop(this.audioContext.currentTime + 0.1);
  }

  startGlitchEffects() {
    // Random screen glitches
    setInterval(() => {
      if (Math.random() < 0.1) {
        // 10% chance every interval
        this.triggerScreenGlitch();
      }
    }, 3000);

    // Text glitches
    setInterval(() => {
      this.glitchRandomText();
    }, 8000);
  }

  triggerScreenGlitch() {
    const glitchDuration = 100 + Math.random() * 200;

    this.screen.style.transform = `translate(${Math.random() * 4 - 2}px, ${
      Math.random() * 4 - 2
    }px)`;
    this.screen.style.filter = "hue-rotate(90deg) saturate(2)";

    setTimeout(() => {
      this.screen.style.transform = "";
      this.screen.style.filter = "";
    }, glitchDuration);
  }

  glitchRandomText() {
    const textElements = document.querySelectorAll(
      ".channel.active p, .channel.active span"
    );
    if (textElements.length === 0) return;

    const randomElement =
      textElements[Math.floor(Math.random() * textElements.length)];
    const originalText = randomElement.textContent;

    // Glitch characters
    const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`";
    let glitchedText = "";

    for (let char of originalText) {
      if (Math.random() < 0.1 && char !== " ") {
        glitchedText +=
          glitchChars[Math.floor(Math.random() * glitchChars.length)];
      } else {
        glitchedText += char;
      }
    }

    randomElement.textContent = glitchedText;

    setTimeout(() => {
      randomElement.textContent = originalText;
    }, 150);
  }

  createStaticBurst() {
    const burst = document.createElement("div");
    burst.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" stitchTiles="stitch"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.8"/></svg>');
            pointer-events: none;
            z-index: 15;
            opacity: 0.6;
            animation: staticBurst 0.3s ease-out;
        `;

    this.screen.appendChild(burst);

    setTimeout(() => {
      burst.remove();
    }, 300);
  }

  randomScreenFlicker() {
    const flickers = Math.floor(Math.random() * 3) + 1;
    let count = 0;

    const flicker = () => {
      this.screen.style.opacity = Math.random() < 0.5 ? "0.8" : "1";
      count++;

      if (count < flickers) {
        setTimeout(flicker, 50 + Math.random() * 100);
      } else {
        this.screen.style.opacity = "1";
      }
    };

    flicker();
  }

  randomStaticBurst() {
    if (Math.random() < 0.3) {
      // 30% chance
      this.createStaticBurst();
      if (this.isAudioEnabled) {
        this.playChannelSwitchSound();
      }
    }
  }

  setupTypewriterEffect() {
    const typewriterElements = document.querySelectorAll(".typewriter");

    typewriterElements.forEach((element) => {
      const text = element.textContent;
      element.textContent = "";
      element.style.width = "0";

      setTimeout(() => {
        this.typeText(element, text, 100);
      }, 2000);
    });
  }

  typeText(element, text, delay) {
    let index = 0;
    element.style.width = "auto";

    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, delay + Math.random() * 50);
      }
    };

    type();
  }

  setupCursorTracking() {
    let cursorVisible = true;
    document.addEventListener("mousemove", () => {
      if (!cursorVisible) {
        document.body.style.cursor = "none";
        cursorVisible = true;
      }
    });

    // Custom cursor effect
    const cursor = document.createElement("div");
    cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: rgba(0, 255, 65, 0.5);
            border: 1px solid #00ff41;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            mix-blend-mode: difference;
            transition: transform 0.1s ease;
        `;
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX - 10 + "px";
      cursor.style.top = e.clientY - 10 + "px";
    });

    document.addEventListener("mousedown", () => {
      cursor.style.transform = "scale(1.5)";
    });

    document.addEventListener("mouseup", () => {
      cursor.style.transform = "scale(1)";
    });
  }

  setupSecretChannel() {
    // Binary message decoder
    const binaryMessages = document.querySelectorAll(".secret-message");
    binaryMessages.forEach((msg) => {
      msg.addEventListener("click", () => {
        const binary = msg.textContent.replace(/\s/g, "");
        const text = this.binaryToText(binary);
        if (text) {
          msg.textContent = text;
          setTimeout(() => {
            msg.textContent = binary.match(/.{8}/g).join(" ");
          }, 3000);
        }
      });
    });
  }

  binaryToText(binary) {
    try {
      return binary
        .match(/.{8}/g)
        .map((byte) => String.fromCharCode(parseInt(byte, 2)))
        .join("");
    } catch (e) {
      return null;
    }
  }

  triggerWelcomeEffect() {
    const glitchText = document.querySelector(".glitch-text");
    if (glitchText) {
      glitchText.style.animation = "glitch 0.5s infinite";
      setTimeout(() => {
        glitchText.style.animation = "glitch 2s infinite";
      }, 3000);
    }
  }

  triggerSecretChannelEffects() {
    // Intensify effects for secret channel
    this.staticOverlay.style.animation = "staticNoise 0.05s infinite linear";
    this.screen.style.filter = "brightness(1.2) contrast(1.1)";

    // Reset after a while
    setTimeout(() => {
      this.staticOverlay.style.animation = "";
      this.screen.style.filter = "";
    }, 5000);

    // Creepy message timer
    const ringMessage = document.querySelector(".ring-message");
    if (ringMessage) {
      setTimeout(() => {
        this.typeText(
          ringMessage.querySelector(".creepy-text"),
          "You have been marked...",
          200
        );
      }, 2000);
    }
  }

  triggerContactWarning() {
    const warningText = document.querySelector(".warning-text");
    if (warningText) {
      warningText.style.animation = "dangerBlink 0.5s infinite";
      setTimeout(() => {
        warningText.style.animation = "dangerBlink 1s infinite";
      }, 3000);
    }
  }

  triggerHorrorVideo() {
    const video = document.querySelector(".horror-video");
    if (video) {
      // Try to play with sound after user interaction
      video.muted = false;
      video.play().catch(() => {
        // If autoplay with sound fails, the video will still play muted
        console.log("Autoplay with sound blocked by browser");
      });
    }
  }

  stopHorrorVideo() {
    const video = document.querySelector(".horror-video");
    if (video) {
      // Mute and pause the video when leaving channel 7
      video.muted = true;
      video.pause();
    }
  }

  emergencyShutdown() {
    // Fake "emergency shutdown" effect
    const shutdownOverlay = document.createElement("div");
    shutdownOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: black;
            color: #00ff41;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Share Tech Mono', monospace;
            font-size: 24px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
    shutdownOverlay.textContent = "EMERGENCY SHUTDOWN INITIATED...";

    document.body.appendChild(shutdownOverlay);

    setTimeout(() => {
      shutdownOverlay.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      shutdownOverlay.style.opacity = "0";
      setTimeout(() => {
        shutdownOverlay.remove();
      }, 500);
    }, 2000);
  }

  preloadEffects() {
    // Add dynamic CSS animations
    const style = document.createElement("style");
    style.textContent = `
            @keyframes staticBurst {
                0% { opacity: 0; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.1); }
                100% { opacity: 0; transform: scale(1); }
            }
            
            .matrix-rain {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                pointer-events: none;
            }
            
            .matrix-char {
                position: absolute;
                color: #00ff41;
                font-family: 'Share Tech Mono', monospace;
                font-size: 14px;
                opacity: 0.7;
                animation: matrixFall 3s linear infinite;
            }
            
            @keyframes matrixFall {
                0% { transform: translateY(-100vh); opacity: 1; }
                100% { transform: translateY(100vh); opacity: 0; }
            }
        `;
    document.head.appendChild(style);
  }
}

// Initialize the Horror TV when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new HorrorTV();

  // Additional page-specific effects
  setTimeout(() => {
    console.log(
      "%c📺 CHANNEL APOORV - HORROR PORTFOLIO",
      "color: #00ff41; font-size: 16px; background: black; padding: 10px;"
    );
    console.log(
      "%cYou've accessed the developer console. The TV is watching you...",
      "color: #ff0000; font-size: 12px;"
    );
  }, 1000);
});

// Prevent right-click context menu for full immersion
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    document.title = "📺 SIGNAL LOST...";
  } else {
    document.title = "📺 CHANNEL APOORV - HORROR PORTFOLIO";
  }
});
