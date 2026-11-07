"use strict";

const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const backToTop = document.getElementById("backToTop");
const profileImage = document.getElementById("heroProfileImage");
const photoInput = document.getElementById("profilePhotoInput");
const uploadStatus = document.getElementById("uploadStatus");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.getElementById("year").textContent = new Date().getFullYear();

try {
  const savedPhoto = localStorage.getItem("maneeshaProfilePhoto");
  if (savedPhoto) profileImage.src = savedPhoto;
} catch {
  showUploadStatus("Saved profile photo could not be loaded from this browser.", true);
}

profileImage.addEventListener("error", () => {
  if (profileImage.getAttribute("src") !== "/images/profile-1793973922501.jpeg") {
    profileImage.src = "/images/profile-1793973922501.jpeg";
  }
});

function setTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
  document.querySelector('meta[name="theme-color"]').content =
    theme === "dark" ? "#071827" : "#f5f9fb";
}

setTheme(root.dataset.theme);

themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);

  try {
    localStorage.setItem("portfolio-theme", nextTheme);
  } catch {
    showUploadStatus("Theme changed, but this browser could not save your preference.", true);
  }
});

function closeNavigation() {
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation menu");
  navLinks.classList.remove("open");
}

navToggle.addEventListener("click", () => {
  const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isExpanded));
  navToggle.setAttribute(
    "aria-label",
    isExpanded ? "Open navigation menu" : "Close navigation menu"
  );
  navLinks.classList.toggle("open", !isExpanded);
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeNavigation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navLinks.classList.contains("open")) {
    closeNavigation();
    navToggle.focus();
  }
});

document.addEventListener("click", (event) => {
  if (!navLinks.contains(event.target) && !navToggle.contains(event.target)) {
    closeNavigation();
  }
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -35px 0px" }
  );
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

const sectionLinks = [...document.querySelectorAll(".nav-links a")];
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${entry.target.id}`;
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
          link.classList.toggle("active", isActive);
        });
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );
  observedSections.forEach((section) => sectionObserver.observe(section));
}

function updateBackToTop() {
  backToTop.classList.toggle("visible", window.scrollY > 560);
}

window.addEventListener("scroll", updateBackToTop, { passive: true });
updateBackToTop();
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
});

document.getElementById("cameraButton").addEventListener("click", () => photoInput.click());

function showUploadStatus(message, isError = false) {
  uploadStatus.textContent = message;
  uploadStatus.classList.toggle("error", isError);
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedExtensions = /\.(jpe?g|png|webp)$/i;
  if (!allowedTypes.includes(file.type) || !allowedExtensions.test(file.name)) {
    showUploadStatus("Choose a JPG, JPEG, PNG or WEBP image.", true);
    photoInput.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showUploadStatus("Choose an image smaller than 2 MB.", true);
    photoInput.value = "";
    return;
  }

  const previousImage = profileImage.getAttribute("src");
  const previewUrl = URL.createObjectURL(file);
  profileImage.src = previewUrl;
  showUploadStatus("Updating your profile photo…");

  try {
    const formData = new FormData();
    formData.append("profilePhoto", file);
    const response = await fetch("/upload-profile", { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "The profile photo could not be uploaded.");
    }

    profileImage.src = result.imageUrl;
    try {
      localStorage.setItem("maneeshaProfilePhoto", result.imageUrl);
      showUploadStatus(result.message || "Profile photo updated.");
    } catch {
      showUploadStatus("Photo uploaded, but this browser could not save its display preference.", true);
    }
  } catch (error) {
    profileImage.src = previousImage;
    showUploadStatus(error.message || "The profile photo could not be uploaded.", true);
  } finally {
    URL.revokeObjectURL(previewUrl);
    photoInput.value = "";
  }
});
