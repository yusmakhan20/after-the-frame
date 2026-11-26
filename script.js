(() => {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  // CUSTOM PLAYFUL CURSOR
  const cursor = $("#cursor");

  if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener("pointermove", e => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      cursor.classList.add("visible");
    });

    $$("a, button, .polaroid").forEach(element => {
      element.addEventListener("pointerenter", () => {
        cursor.classList.add("big");
      });

      element.addEventListener("pointerleave", () => {
        cursor.classList.remove("big");
      });
    });
  }

  // FLOATING HANDWRITTEN MESSAGES
  const floatingNote = $("#floatingNote");

  const floatingMessages = [
    "Look a little closer ♡",
    "You found a tiny moment ✳",
    "Keep collecting memories",
    "The ordinary is beautiful",
    "Something worth remembering ♡",
    "A little magic, just for you"
  ];

  let floatingTimer;

  function showFloatingNote(message) {
    floatingNote.textContent =
      message ||
      floatingMessages[
        Math.floor(Math.random() * floatingMessages.length)
      ];

    floatingNote.classList.add("show");

    clearTimeout(floatingTimer);

    floatingTimer = setTimeout(() => {
      floatingNote.classList.remove("show");
    }, 2600);
  }

  // TOAST NOTIFICATION
  const toastElement = $("#toast");
  let toastTimer;

  function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toastElement.classList.remove("show");
    }, 2100);
  }

  // OPTIONAL SOUND EFFECTS
  let soundOn = false;
  let audioContext = null;

  function playClick() {
    if (!soundOn || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 660;

    gain.gain.setValueAtTime(
      0.028,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.1
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.11);
  }

  $("#soundBtn").addEventListener("click", async () => {
    soundOn = !soundOn;

    $("#soundBtn").textContent = soundOn
      ? "♫ SOUND ON"
      : "♫ SOUND OFF";

    $("#soundBtn").setAttribute(
      "aria-pressed",
      String(soundOn)
    );

    if (soundOn) {
      const AudioClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioClass) {
        soundOn = false;
        $("#soundBtn").textContent = "♫ SOUND UNAVAILABLE";
        return;
      }

      audioContext ||= new AudioClass();

      await audioContext.resume();
      playClick();
    }
  });

  // GALLERY FILTERING
  const galleryCards = $$(".frame");
  let activeFilter = "all";

  function visibleCards() {
    return $$("#galleryGrid .frame:not(.hidden)");
  }

  $$(".filters button").forEach(button => {
    button.addEventListener("click", () => {
      $$(".filters button").forEach(b => {
        b.classList.remove("active");
      });

      button.classList.add("active");
      activeFilter = button.dataset.filter;

      galleryCards.forEach(card => {
        const shouldHide =
          activeFilter !== "all" &&
          card.dataset.category !== activeFilter;

        card.classList.toggle("hidden", shouldHide);
      });

      playClick();
    });
  });

  // SHUFFLE THE GALLERY
  $("#shuffleBtn").addEventListener("click", () => {
    const grid = $("#galleryGrid");
    const cards = visibleCards();

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    cards.forEach(card => {
      grid.appendChild(card);
    });

    toast("FRAMES SHUFFLED ✳");
    showFloatingNote("A new way of looking ♡");
    playClick();
  });

  // GALLERY POPUP / LIGHTBOX
  const lightbox = $("#lightbox");
  const bigPhoto = $("#bigPhoto");

  let currentPhotoIndex = 0;
  let previousFocus = null;

  function displayPhoto(card) {
    const cards = visibleCards();
    currentPhotoIndex = cards.indexOf(card);

    if (currentPhotoIndex < 0) {
      currentPhotoIndex = 0;
    }

    const image = $("img", card);
    bigPhoto.src = image.src;
    bigPhoto.alt = image.alt;

    $("#photoCount").textContent =
      `${currentPhotoIndex + 1} / ${cards.length}`;

    $("#photoCaption").textContent =
      card.dataset.caption || "";
  }

  function openLightbox(card) {
    previousFocus = document.activeElement;
    displayPhoto(card);

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
    $("#closeLightbox").focus();

    playClick();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  function changePhoto(direction) {
    const cards = visibleCards();

    if (!cards.length) return;

    const nextIndex =
      (currentPhotoIndex + direction + cards.length) %
      cards.length;

    displayPhoto(cards[nextIndex]);
    playClick();
  }

  galleryCards.forEach(card => {
    card.addEventListener("click", () => {
      openLightbox(card);
    });
  });

  $("#closeLightbox").addEventListener("click", closeLightbox);
  $("#previousPhoto").addEventListener("click", () => changePhoto(-1));
  $("#nextPhoto").addEventListener("click", () => changePhoto(1));

  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") changePhoto(-1);
    if (e.key === "ArrowRight") changePhoto(1);
  });

  // INTERACTIVE FILM ROLL
  const filmTrack = $("#filmTrack");

  let isFilmDown = false;
  let filmStartX = 0;
  let filmStartScroll = 0;
  let filmWasDragged = false;
  let suppressFilmClick = false;

  filmTrack.addEventListener("pointerdown", e => {
    if (e.button !== undefined && e.button !== 0) return;

    isFilmDown = true;
    filmWasDragged = false;
    filmStartX = e.clientX;
    filmStartScroll = filmTrack.scrollLeft;
  });

  filmTrack.addEventListener("pointermove", e => {
    if (!isFilmDown) return;

    const difference = e.clientX - filmStartX;

    if (Math.abs(difference) > 6) {
      filmWasDragged = true;
      filmTrack.classList.add("dragging");

      if (!filmTrack.hasPointerCapture(e.pointerId)) {
        filmTrack.setPointerCapture(e.pointerId);
      }
    }

    if (filmWasDragged) {
      filmTrack.scrollLeft = filmStartScroll - difference;
    }
  });

  function endFilmDrag() {
    if (!isFilmDown) return;

    isFilmDown = false;
    filmTrack.classList.remove("dragging");

    if (filmWasDragged) {
      suppressFilmClick = true;
      setTimeout(() => {
        suppressFilmClick = false;
      }, 50);
    }
  }

  filmTrack.addEventListener("pointerup", endFilmDrag);
  filmTrack.addEventListener("pointercancel", endFilmDrag);
  window.addEventListener("pointerup", endFilmDrag);

  filmTrack.addEventListener("click", e => {
    const frame = e.target.closest(".film-frame");
    if (!frame || suppressFilmClick) return;

    const index = Number(frame.dataset.photo);
    const galleryCard = galleryCards[index];
    if (!galleryCard) return;

    if (galleryCard.classList.contains("hidden")) {
      $('.filters button[data-filter="all"]').click();
    }

    openLightbox(galleryCard);
    showFloatingNote("Another frame discovered ♡");
  });

  $("#filmPrev").addEventListener("click", () => {
    filmTrack.scrollBy({ left: -300, behavior: "smooth" });
    playClick();
  });

  $("#filmNext").addEventListener("click", () => {
    filmTrack.scrollBy({ left: 300, behavior: "smooth" });
    playClick();
  });

  // DRAGGABLE POLAROID SCRAPBOOK
  const board = $("#board");
  const polaroids = $$(".polaroid", board);
  let highestZIndex = 10;

  polaroids.forEach(polaroid => {
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    let dragging = false;

    polaroid.addEventListener("pointerdown", e => {
      if (e.button !== undefined && e.button !== 0) return;

      const photoRect = polaroid.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      initialX = photoRect.left - boardRect.left;
      initialY = photoRect.top - boardRect.top;

      polaroid.style.left = initialX + "px";
      polaroid.style.top = initialY + "px";
      polaroid.style.right = "auto";
      polaroid.style.bottom = "auto";
      polaroid.style.transform = "rotate(0deg)";
      polaroid.style.zIndex = ++highestZIndex;

      dragging = true;
      polaroid.classList.add("dragging");
      polaroid.setPointerCapture(e.pointerId);
    });

    polaroid.addEventListener("pointermove", e => {
      if (!dragging) return;

      const newX = initialX + e.clientX - startX;
      const newY = initialY + e.clientY - startY;

      const maxX = board.clientWidth - polaroid.offsetWidth;
      const maxY = board.clientHeight - polaroid.offsetHeight;

      polaroid.style.left =
        Math.max(0, Math.min(maxX, newX)) + "px";

      polaroid.style.top =
        Math.max(0, Math.min(maxY, newY)) + "px";
    });

    function stopDragging() {
      if (!dragging) return;

      dragging = false;
      polaroid.classList.remove("dragging");

      const angle = Number(polaroid.dataset.angle) || 0;
      polaroid.style.transform = `rotate(${angle}deg)`;
    }

    polaroid.addEventListener("pointerup", stopDragging);
    polaroid.addEventListener("pointercancel", stopDragging);
  });

  // RESET SCRAPBOOK
  $("#resetBoard").addEventListener("click", () => {
    polaroids.forEach(polaroid => {
      polaroid.style.left = "";
      polaroid.style.top = "";
      polaroid.style.right = "";
      polaroid.style.bottom = "";
      polaroid.style.transform = "";
      polaroid.style.zIndex = "";
    });

    toast("SCRAPBOOK RESET ↺");
    playClick();
  });

  // SURPRISE ME
  $("#surpriseBtn").addEventListener("click", () => {
    const cards = visibleCards();
    if (!cards.length) return;

    const randomIndex = Math.floor(Math.random() * cards.length);
    const chosen = cards[randomIndex];

    $("#surpriseCaption").textContent =
      "TODAY'S MEMORY: " + chosen.dataset.caption;

    showFloatingNote("Fate picked this one ✳");
    openLightbox(chosen);
  });

  // SECRET ARCHIVE
  const secretMessages = [
    "Some days are worth keeping, even when nothing special happens. ♡",
    "Take the picture. You can figure out the rest later.",
    "The smallest moments sometimes take up the most space in our hearts.",
    "Look closer. There is always more to see.",
    "You are allowed to be a work in progress. ✳",
    "This is your reminder to notice the ordinary."
  ];

  let noteIndex = 0;

  function revealSecretNote() {
    const index = noteIndex % secretMessages.length;

    $("#noteNumber").textContent =
      String(index + 1).padStart(2, "0");

    $("#secretText").textContent = secretMessages[index];
    noteIndex++;

    $("#envelope").classList.toggle("opened");
    showFloatingNote("You found a hidden little note ♡");
    playClick();
  }

  $("#envelope").addEventListener("click", revealSecretNote);
  $("#nextNote").addEventListener("click", revealSecretNote);

  // PHOTO QUIZ
  $$(".answers button").forEach(button => {
    button.addEventListener("click", () => {
      $$(".answers button").forEach(b => {
        b.classList.remove("selected");
      });

      button.classList.add("selected");

      if (button.dataset.right === "yes") {
        $("#quizResult").textContent =
          "EXACTLY! THE FEELING IS THE WHOLE POINT ♡";
        showFloatingNote("You get it! ♡");
      } else {
        $("#quizResult").textContent =
          "NICE TRY! SOMETIMES THE FEELING MATTERS MOST ✳";
      }

      playClick();
    });
  });

  // SUBTLE HERO PHOTO TILT
  const heroPhoto = $("#heroPolaroid");

  if (window.matchMedia("(pointer: fine)").matches) {
    heroPhoto.addEventListener("pointermove", e => {
      const rect = heroPhoto.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      heroPhoto.style.transform =
        `rotate(8deg) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });

    heroPhoto.addEventListener("pointerleave", () => {
      heroPhoto.style.transform = "rotate(8deg)";
    });
  }

  // FOUR-PHOTO PHOTO BOOTH
  const canvas = $("#boothCanvas");
  const ctx = canvas.getContext("2d");
  const createStripBtn = $("#createStrip");
  const saveStripBtn = $("#saveStrip");
  const boothStatus = $("#boothStatus");

  function drawEmptyStrip() {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5dce0";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#33282d";
    ctx.textAlign = "center";
    ctx.font = "bold 26px Georgia";
    ctx.fillText("AFTER THE FRAME", width / 2, 65);

    ctx.font = "14px monospace";
    ctx.fillText("YOUR LITTLE PHOTO BOOTH", width / 2, 91);

    for (let i = 0; i < 4; i++) {
      const y = 125 + i * 263;

      ctx.fillStyle = "#fffaf6";
      ctx.fillRect(40, y, 340, 245);

      ctx.fillStyle = "#d8a4ad";
      ctx.font = "52px Georgia";
      ctx.fillText("✳", width / 2, y + 145);
    }

    ctx.fillStyle = "#a96e7c";
    ctx.font = "italic 23px Georgia";
    ctx.fillText("four little moments ♡", width / 2, 1250);

    ctx.font = "13px monospace";
    ctx.fillText("@__tinymoments", width / 2, 1310);
  }

  drawEmptyStrip();

  function loadPhoto(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => {
        reject(new Error("Could not load photograph: " + src));
      };

      img.src = src;
    });
  }

  function drawCover(image, x, y, width, height) {
    const scale = Math.max(
      width / image.width,
      height / image.height
    );

    const cropWidth = width / scale;
    const cropHeight = height / scale;
    const cropX = (image.width - cropWidth) / 2;
    const cropY = (image.height - cropHeight) / 2;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      x,
      y,
      width,
      height
    );
  }

  function drawPhotoStrip(images) {
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5dce0";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#33282d";
    ctx.textAlign = "center";
    ctx.font = "bold 26px Georgia";
    ctx.fillText("AFTER THE FRAME", width / 2, 65);

    ctx.font = "13px monospace";
    ctx.fillText("A LITTLE COLLECTION OF MOMENTS", width / 2, 91);

    images.forEach((image, index) => {
      const x = 45;
      const y = 125 + index * 263;
      const photoWidth = 330;
      const photoHeight = 238;

      ctx.fillStyle = "#fffaf6";
      ctx.fillRect(
        x - 5,
        y - 5,
        photoWidth + 10,
        photoHeight + 10
      );

      drawCover(image, x, y, photoWidth, photoHeight);
    });

    ctx.fillStyle = "#a96e7c";
    ctx.font = "italic 25px Georgia";
    ctx.fillText(
      "little moments, big memories ♡",
      width / 2,
      1240
    );

    ctx.font = "14px monospace";
    ctx.fillText("@__tinymoments", width / 2, 1300);

    ctx.font = "12px monospace";
    ctx.fillText(
      "AFTER THE FRAME / PHOTO BOOTH",
      width / 2,
      1330
    );
  }

  function chooseFourPhotos() {
    const currentSources = galleryCards
      .map(card => $("img", card).src)
      .filter(Boolean);

    const shuffled = [...currentSources];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 4);
  }

  createStripBtn.addEventListener("click", async () => {
    createStripBtn.disabled = true;
    saveStripBtn.disabled = true;
    boothStatus.textContent = "Collecting four little moments...";

    const selectedPhotos = chooseFourPhotos();

    try {
      const images = await Promise.all(
        selectedPhotos.map(loadPhoto)
      );

      drawPhotoStrip(images);
      saveStripBtn.disabled = false;
      boothStatus.textContent = "Your photo strip is ready! Save it ♡";

      showFloatingNote("A tiny keepsake, just for you ✳");
      playClick();
    } catch (error) {
      console.error(error);
      boothStatus.textContent =
        "Couldn't find your photos. Check the images folder.";
      toast("PLEASE CHECK YOUR PHOTO FILES");
    } finally {
      createStripBtn.disabled = false;
    }
  });

  saveStripBtn.addEventListener("click", async () => {
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(file => {
          if (file) {
            resolve(file);
          } else {
            reject(new Error("Could not export image"));
          }
        }, "image/png");
      });

      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = url;
      downloadLink.download = "after-the-frame-photo-strip.png";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 3000);

      boothStatus.textContent = "A little memory to keep forever ♡";
      showFloatingNote("Keep this one ♡");
      playClick();
    } catch (error) {
      console.error(error);
      boothStatus.textContent =
        "Download blocked. Open the site with VS Code Live Server and try again.";
      toast("PHOTO STRIP COULD NOT BE SAVED");
    }
  });

  // SMOOTH SCROLL REVEAL ANIMATIONS
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if ("IntersectionObserver" in window && !reducedMotion) {
    const sections = $$(
      ".gallery-section, .film-section, .quote, " +
      ".play-section, .surprise-section, .archive-section, " +
      ".quiz-section, .booth-section, .about-section, " +
      ".contact-section"
    );

    sections.forEach(section => {
      section.classList.add("reveal");
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.06
    });

    sections.forEach(section => observer.observe(section));
  }
})();

/* MINIMAL PHOTOGRAPHY WEBSITE SOUND */
(() => {
  let enabled = false;
  let audio = null;

  const soundButton = document.querySelector(
    "#soundBtn, #sound, #soundToggle"
  );

  function softClick() {
    if (!enabled || !audio) return;

    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(700, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      320,
      now + 0.12
    );

    volume.gain.setValueAtTime(0.06, now);
    volume.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.12
    );

    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  if (!soundButton) {
    console.warn("Sound button not found.");
    return;
  }

  soundButton.addEventListener("click", async event => {
    event.stopImmediatePropagation();

    if (!audio) {
      const AudioClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioClass) {
        alert("Audio is not supported by this browser.");
        return;
      }

      audio = new AudioClass();
    }

    await audio.resume();
    enabled = !enabled;

    soundButton.textContent = enabled
      ? "♫ SOUND ON"
      : "♫ SOUND OFF";

    soundButton.setAttribute("aria-pressed", String(enabled));
    softClick();
  }, true);

  document.addEventListener("click", event => {
    if (!enabled) return;

    if (event.target.closest(
      ".frame, .film-frame, .filters button, " +
      "#shuffleBtn, #surpriseBtn, #envelope, " +
      "#nextNote, .answers button, " +
      "#createStrip, #filmPrev, #filmNext"
    )) {
      softClick();
    }
  });
})();

/* ADD INSTAGRAM NEXT TO WHATSAPP */
document.addEventListener("DOMContentLoaded", () => {
  const whatsapp = document.querySelector(
    '.contact-section a[href*="wa.me"], .contact a[href*="wa.me"]'
  );

  if (!whatsapp || document.querySelector("#instagramContact")) {
    return;
  }

  const instagram = document.createElement("a");
  instagram.id = "instagramContact";
  instagram.href = "https://instagram.com/__tinymoments";
  instagram.target = "_blank";
  instagram.rel = "noopener noreferrer";
  instagram.className = "pill rose";
  instagram.textContent = "INSTAGRAM ↗";

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.justifyContent = "center";
  buttons.style.alignItems = "center";
  buttons.style.flexWrap = "wrap";
  buttons.style.gap = "15px";
  buttons.style.marginTop = "30px";

  whatsapp.parentNode.insertBefore(buttons, whatsapp);
  buttons.appendChild(whatsapp);
  buttons.appendChild(instagram);

  whatsapp.style.marginTop = "0";
  instagram.style.marginTop = "0";
});

/* CINEMATIC INTRO */
(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion || document.getElementById("aftIntro")) return;

  const intro = document.createElement("div");
  intro.id = "aftIntro";

  intro.innerHTML = `
    <button id="aftSkip" type="button">SKIP ↗</button>
    <div class="aft-intro-content">
      <span class="aft-intro-small">OPENING THE PHOTO DIARY</span>
      <div class="aft-intro-photo">
        <img src="images/photo1.jpg" alt="A moment from the collection">
      </div>
      <span class="aft-intro-star">✳</span>
      <h1 class="aft-intro-title">AFTER <em>THE</em> FRAME.</h1>
      <p class="aft-intro-sub">EVERY FRAME HAS A STORY ♡</p>
    </div>
  `;

  document.documentElement.classList.add("aft-intro-active");
  document.body.appendChild(intro);

  let finished = false;

  const onKeyDown = event => {
    if (event.key === "Escape") finishIntro();
  };

  document.addEventListener("keydown", onKeyDown);

  function finishIntro() {
    if (finished) return;
    finished = true;

    clearTimeout(autoClose);
    intro.classList.add("aft-exit");

    setTimeout(() => {
      intro.remove();
      document.documentElement.classList.remove("aft-intro-active");
      document.removeEventListener("keydown", onKeyDown);
    }, 700);
  }

  document.getElementById("aftSkip").addEventListener(
    "click",
    finishIntro
  );

  const autoClose = setTimeout(finishIntro, 1500);
})();

/* WELCOME SCREEN */
(() => {
  function createWelcome() {
    if (document.getElementById("aftWelcome")) return;

    const styles = document.createElement("style");

    styles.textContent = `
      #aftWelcome {
        position: fixed;
        inset: 0;
        z-index: 100001;
        background: #342b30;
        color: #f8f0e9;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 35px 20px;
        text-align: center;
        overflow-y: auto;
        transition: opacity .5s, transform .5s;
      }

      #aftWelcome.closing {
        opacity: 0;
        transform: translateY(-35px);
        pointer-events: none;
      }

      .aft-welcome-inner {
        max-width: 750px;
        animation: aftWelcomePop .8s ease both;
      }

      .aft-welcome-star {
        font-size: 48px;
        color: #d5ad76;
        display: block;
        margin-bottom: 25px;
        animation: aftWelcomeSpin 15s linear infinite;
      }

      .aft-welcome-small {
        font: 10px monospace;
        letter-spacing: 4px;
        color: #d5ad76;
      }

      .aft-welcome-title {
        font-family: Georgia, serif;
        font-size: clamp(42px, 7vw, 85px);
        font-weight: normal;
        line-height: 1.12;
        margin: 25px 0;
      }

      .aft-welcome-title em {
        color: #d5ad76;
        font-weight: normal;
      }

      .aft-welcome-description {
        max-width: 530px;
        margin: 0 auto;
        font-family: Georgia, serif;
        font-size: clamp(16px, 2vw, 21px);
        line-height: 1.85;
        color: #e2d3d0;
      }

      .aft-welcome-line {
        font: italic 19px Georgia, serif;
        color: #d5ad76;
        margin: 25px 0 35px;
      }

      .aft-welcome-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 15px;
      }

      .aft-welcome-buttons button {
        min-width: 175px;
        padding: 16px 23px;
        border: 1px solid #d5ad76;
        font: 11px monospace;
        letter-spacing: 1px;
        cursor: pointer;
        transition: transform .3s, background .3s;
      }

      #aftEnter {
        background: #d5ad76;
        color: #342b30;
      }

      #aftSurprise {
        background: transparent;
        color: #f8f0e9;
      }

      .aft-welcome-buttons button:hover {
        transform: translateY(-5px);
      }

      #aftSurprise:hover {
        background: #d5ad76;
        color: #342b30;
      }

      .aft-welcome-footer {
        margin-top: 50px;
        color: #b8a6a5;
        font: 10px monospace;
        letter-spacing: 2px;
      }

      @keyframes aftWelcomePop {
        from {
          opacity: 0;
          transform: translateY(55px) scale(.92);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes aftWelcomeSpin {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .aft-welcome-inner,
        .aft-welcome-star {
          animation: none;
        }
      }
    `;

    document.head.appendChild(styles);

    const welcome = document.createElement("div");
    welcome.id = "aftWelcome";
    welcome.setAttribute("role", "dialog");
    welcome.setAttribute("aria-modal", "true");
    welcome.setAttribute("aria-label", "Welcome to AFTER THE FRAME");

    welcome.innerHTML = `
      <div class="aft-welcome-inner">
        <span class="aft-welcome-star">✳</span>
        <p class="aft-welcome-small">A LITTLE WORLD THROUGH MY LENS</p>
        <h1 class="aft-welcome-title">
          Welcome to<br>
          <em>AFTER THE FRAME.</em>
        </h1>
        <p class="aft-welcome-description">
          A personal collection of quiet places,
          unexpected moments, and stories
          hidden in the ordinary.
        </p>
        <p class="aft-welcome-line">
          Look closely—every frame has something to say.
        </p>
        <div class="aft-welcome-buttons">
          <button id="aftEnter" type="button">ENTER THE GALLERY ↗</button>
          <button id="aftSurprise" type="button">SURPRISE ME ✳</button>
        </div>
        <p class="aft-welcome-footer">MADE OF LITTLE MOMENTS ♡</p>
      </div>
    `;

    document.body.appendChild(welcome);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function enterWebsite(action) {
      welcome.classList.add("closing");

      setTimeout(() => {
        welcome.remove();
        document.getElementById("aftIntro")?.remove();
        document.documentElement.classList.remove("aft-intro-active");
        document.body.style.overflow = originalOverflow;

        if (action === "gallery") {
          document.getElementById("gallery")?.scrollIntoView({
            behavior: "smooth"
          });
        }

        if (action === "surprise") {
          const surpriseButton =
            document.getElementById("surpriseBtn") ||
            document.getElementById("surprise");

          if (surpriseButton) surpriseButton.click();
        }
      }, 500);
    }

    document.getElementById("aftEnter").addEventListener(
      "click",
      () => enterWebsite("gallery")
    );

    document.getElementById("aftSurprise").addEventListener(
      "click",
      () => enterWebsite("surprise")
    );

    document.getElementById("aftEnter").focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createWelcome,
      { once: true }
    );
  } else {
    createWelcome();
  }
})();