
document.addEventListener("DOMContentLoaded", () => {

  // FILM ROLL — duplicate images for continuous movement
  const filmTrack = document.querySelector(".film-track");

  if (filmTrack) {
    filmTrack.innerHTML += filmTrack.innerHTML;
  }

  // POLAROID — draggable cards
  document.querySelectorAll(".polaroid").forEach(card => {
    let active = false;
    let startX = 0;
    let startY = 0;
    let originalX = 0;
    let originalY = 0;

    card.addEventListener("pointerdown", e => {
      active = true;
      card.classList.add("dragging");
      card.setPointerCapture(e.pointerId);

      const rect = card.getBoundingClientRect();
      const parent = card.parentElement.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;

      originalX = rect.left - parent.left;
      originalY = rect.top - parent.top;
    });

    card.addEventListener("pointermove", e => {
      if (!active) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      card.style.position = "absolute";
      card.style.left = `${originalX + dx}px`;
      card.style.top = `${originalY + dy}px`;
      card.style.margin = "0";
    });

    const stopDrag = () => {
      active = false;
      card.classList.remove("dragging");
    };

    card.addEventListener("pointerup", stopDrag);
    card.addEventListener("pointercancel", stopDrag);
  });

  // CINEMATIC SLIDESHOW
  const cinemaImages = [
    "images/photo-01.jpg",
    "images/photo-02.jpg",
    "images/photo-03.jpg",
    "images/photo-04.jpg",
    "images/photo-05.jpg",
    "images/photo-06.jpg"
  ];

  const cinemaImage = document.getElementById("cinemaImage");
  const cinemaCounter = document.getElementById("cinemaCounter");
  const prev = document.getElementById("cinemaPrev");
  const next = document.getElementById("cinemaNext");
  const play = document.getElementById("cinemaPlay");

  let currentSlide = 0;
  let slideshowTimer = null;

  function showSlide(index) {
    currentSlide = (index + cinemaImages.length) % cinemaImages.length;

    if (!cinemaImage) return;

    cinemaImage.style.opacity = "0";

    setTimeout(() => {
      cinemaImage.src = cinemaImages[currentSlide];
      cinemaCounter.textContent =
        `${String(currentSlide + 1).padStart(2, "0")} / ${String(cinemaImages.length).padStart(2, "0")}`;
      cinemaImage.style.opacity = "1";
    }, 250);
  }

  prev?.addEventListener("click", () => showSlide(currentSlide - 1));
  next?.addEventListener("click", () => showSlide(currentSlide + 1));

  play?.addEventListener("click", () => {
    if (slideshowTimer) {
      clearInterval(slideshowTimer);
      slideshowTimer = null;
      play.textContent = "PLAY SLIDESHOW";
    } else {
      showSlide(currentSlide);
      slideshowTimer = setInterval(
        () => showSlide(currentSlide + 1),
        3500
      );
      play.textContent = "PAUSE SLIDESHOW";
    }
  });

  // SECRET PHOTO ROOM
  const secretRoom = document.getElementById("secretRoom");

  document.getElementById("secretTrigger")?.addEventListener("click", () => {
    secretRoom?.classList.add("open");
    document.body.style.overflow = "hidden";
  });

  document.getElementById("secretClose")?.addEventListener("click", () => {
    secretRoom?.classList.remove("open");
    document.body.style.overflow = "";
  });

  secretRoom?.addEventListener("click", e => {
    if (e.target === secretRoom) {
      secretRoom.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  // AMBIENT SOUND
  const sound = document.getElementById("ambientSound");
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = document.getElementById("soundLabel");

  soundToggle?.addEventListener("click", async () => {
    if (!sound) return;

    if (sound.paused) {
      try {
        await sound.play();
        soundLabel.textContent = "SOUND ON";
      } catch (error) {
        soundLabel.textContent = "AUDIO UNAVAILABLE";
      }
    } else {
      sound.pause();
      soundLabel.textContent = "SOUND OFF";
    }
  });

});
