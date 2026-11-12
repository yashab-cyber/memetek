// ── NAV TOGGLE ──
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });
}

// ── YEAR ──
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
document.querySelectorAll(".year-text").forEach(el => el.textContent = new Date().getFullYear());

// ── REVEAL ANIMATION ──
const revealItems = document.querySelectorAll(
  ".principle-card, .culture-visual, .culture-copy, .community-panel, .airdrop-card, .ca-banner-inner, .form-container, .announcement-card, .gallery-card, .faq-item, .announcements-banner, .gallery-cta-box, .faq-contact-card"
);
revealItems.forEach((item) => item.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// ══════════════════════════════════════════
// SUPABASE CLIENT
// ══════════════════════════════════════════
const SUPABASE_URL = "https://dmobvhevocjpryupnnqk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtb2J2aGV2b2NqcHJ5dXBubnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1MDU5NDAsImV4cCI6MjExMDA4MTk0MH0.mws9TBuCboXCCHs8ySNS2azsOPXHdka9pXxVy_XUnWw";

// Minimal Supabase REST client
const supabase = {
  async getStats() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_airdrop_stats`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  async insert(table, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 409 || err.code === "23505") {
        throw new Error("DUPLICATE");
      }
      if (err.message && err.message.includes("AIRDROP_FULL")) {
        throw new Error("AIRDROP_FULL");
      }
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return { success: true };
  }
};

// ══════════════════════════════════════════
// AIRDROP SPOTS & STATUS SYNC
// ══════════════════════════════════════════
async function syncAirdropStats() {
  const stats = await supabase.getStats();
  if (!stats) return;

  // 1. Homepage counters & card statuses
  const indexTgNum = document.getElementById("indexTgNum");
  const indexTgSpots = document.getElementById("indexTgSpots");
  const cardTgAirdrop = document.getElementById("cardTgAirdrop");
  const btnTgAirdrop = document.getElementById("btnTgAirdrop");
  const badgeTgAirdrop = document.getElementById("badgeTgAirdrop");

  if (indexTgNum) {
    indexTgNum.textContent = stats.telegram_remaining;
    if (stats.telegram_remaining <= 0) {
      if (indexTgSpots) indexTgSpots.innerHTML = "🔒 <strong>All 50 spots claimed</strong> — Closed";
      if (cardTgAirdrop) cardTgAirdrop.classList.add("closed");
      if (btnTgAirdrop) {
        btnTgAirdrop.textContent = "Airdrop Closed 🔒";
        btnTgAirdrop.setAttribute("href", "#airdrop");
      }
      if (badgeTgAirdrop) badgeTgAirdrop.textContent = "CLOSED";
    }
  }

  const indexRdNum = document.getElementById("indexRdNum");
  const indexRdSpots = document.getElementById("indexRdSpots");
  const cardRdAirdrop = document.getElementById("cardRdAirdrop");
  const btnRdAirdrop = document.getElementById("btnRdAirdrop");
  const badgeRdAirdrop = document.getElementById("badgeRdAirdrop");

  if (indexRdNum) {
    indexRdNum.textContent = stats.random_remaining.toLocaleString();
    if (stats.random_remaining <= 0) {
      if (indexRdSpots) indexRdSpots.innerHTML = "🔒 <strong>All 1,000 spots filled</strong> — Closed";
      if (cardRdAirdrop) cardRdAirdrop.classList.add("closed");
      if (btnRdAirdrop) {
        btnRdAirdrop.textContent = "Airdrop Closed 🔒";
        btnRdAirdrop.setAttribute("href", "#airdrop");
      }
      if (badgeRdAirdrop) badgeRdAirdrop.textContent = "CLOSED";
    }
  }

  // 2. Telegram airdrop page counter & gate/closed state
  const tgSpotsBanner = document.getElementById("tgSpotsBanner");
  const tgSpotsRemainingText = document.getElementById("tgSpotsRemainingText");
  const tgClosed = document.getElementById("telegramClosed");
  const codeGate = document.getElementById("codeGate");
  const telegramForm = document.getElementById("telegramForm");

  if (tgSpotsRemainingText) {
    if (stats.telegram_remaining <= 0) {
      if (tgSpotsBanner) tgSpotsBanner.classList.add("closed");
      tgSpotsRemainingText.innerHTML = "🔒 All 50 spots claimed (0 remaining)";
      if (codeGate) codeGate.style.display = "none";
      if (telegramForm) telegramForm.style.display = "none";
      if (tgClosed) tgClosed.style.display = "block";
    } else {
      tgSpotsRemainingText.innerHTML = `🔥 <strong>${stats.telegram_remaining}</strong> of ${stats.telegram_total} spots remaining`;
    }
  }

  // 3. Random airdrop page counter & form/closed state
  const rdSpotsBanner = document.getElementById("rdSpotsBanner");
  const rdSpotsRemainingText = document.getElementById("rdSpotsRemainingText");
  const randomForm = document.getElementById("randomForm");
  const rdClosed = document.getElementById("randomClosed");

  if (rdSpotsRemainingText) {
    if (stats.random_remaining <= 0) {
      if (rdSpotsBanner) rdSpotsBanner.classList.add("closed");
      rdSpotsRemainingText.innerHTML = "🔒 All 1,000 spots filled (0 remaining)";
      if (randomForm) randomForm.style.display = "none";
      if (rdClosed) rdClosed.style.display = "block";
    } else {
      rdSpotsRemainingText.innerHTML = `🎲 <strong>${stats.random_remaining.toLocaleString()}</strong> of ${stats.random_total.toLocaleString()} spots remaining`;
    }
  }
}

// Initial fetch on load
syncAirdropStats();

// ══════════════════════════════════════════
// AIRDROP CODE VERIFICATION
// ══════════════════════════════════════════
const ACCESS_CODE = "MEMETEK2026";

const verifyCodeBtn = document.getElementById("verifyCodeBtn");
if (verifyCodeBtn) {
  verifyCodeBtn.addEventListener("click", () => {
    const codeInput = document.getElementById("accessCode");
    const codeError = document.getElementById("codeError");
    const codeGate = document.getElementById("codeGate");
    const telegramForm = document.getElementById("telegramForm");

    if (codeInput.value.trim().toUpperCase() === ACCESS_CODE) {
      codeGate.style.display = "none";
      telegramForm.style.display = "block";
      telegramForm.classList.add("visible");
      codeError.style.display = "none";
    } else {
      codeError.style.display = "block";
      codeInput.value = "";
      codeInput.focus();
    }
  });
}

// ══════════════════════════════════════════
// TELEGRAM AIRDROP FORM → SUPABASE
// ══════════════════════════════════════════
const submitTelegramBtn = document.getElementById("submitTelegramBtn");
if (submitTelegramBtn) {
  submitTelegramBtn.addEventListener("click", async () => {
    const solAddress = document.getElementById("tgSolAddress").value.trim();
    const xUsername = document.getElementById("tgXUsername").value.trim();
    const tgUsername = document.getElementById("tgTelegramUsername").value.trim();
    const agreeTerms = document.getElementById("tgAgreeTerms");
    const termsError = document.getElementById("tgTermsError");

    if (!solAddress || !xUsername || !tgUsername) {
      alert("Please fill in all fields.");
      return;
    }

    if (!agreeTerms.checked) {
      if (termsError) termsError.style.display = "block";
      return;
    }
    if (termsError) termsError.style.display = "none";

    // Disable button while submitting
    submitTelegramBtn.disabled = true;
    submitTelegramBtn.innerHTML = "Submitting... <span>⏳</span>";

    try {
      await supabase.insert("telegram_airdrop", {
        sol_address: solAddress,
        x_username: xUsername,
        telegram_username: tgUsername
      });

      // Show success
      document.getElementById("telegramForm").style.display = "none";
      const success = document.getElementById("telegramSuccess");
      success.style.display = "block";
      success.classList.add("visible");

      // Show congrats modal
      showCongratsModal();

      // Sync spot countdown
      syncAirdropStats();
    } catch (err) {
      submitTelegramBtn.disabled = false;
      submitTelegramBtn.innerHTML = "Submit Registration <span>→</span>";

      if (err.message === "DUPLICATE") {
        alert("⚠️ This SOL address or Telegram username has already been registered for the direct airdrop.");
      } else if (err.message === "AIRDROP_FULL") {
        alert("🔒 Sorry! All 50 spots have already been claimed.");
        syncAirdropStats();
      } else {
        alert("❌ Something went wrong. Please try again.\n\n" + err.message);
      }
    }
  });
}

// ══════════════════════════════════════════
// RANDOM AIRDROP FORM → SUPABASE
// ══════════════════════════════════════════
const submitRandomBtn = document.getElementById("submitRandomBtn");
if (submitRandomBtn) {
  submitRandomBtn.addEventListener("click", async () => {
    const solAddress = document.getElementById("rdSolAddress").value.trim();
    const xUsername = document.getElementById("rdXUsername").value.trim();
    const tgUsername = document.getElementById("rdTelegramUsername").value.trim();
    const agreeTerms = document.getElementById("rdAgreeTerms");
    const termsError = document.getElementById("rdTermsError");

    if (!solAddress || !xUsername || !tgUsername) {
      alert("Please fill in all fields.");
      return;
    }

    if (!agreeTerms.checked) {
      if (termsError) termsError.style.display = "block";
      return;
    }
    if (termsError) termsError.style.display = "none";

    // Disable button while submitting
    submitRandomBtn.disabled = true;
    submitRandomBtn.innerHTML = "Submitting... <span>⏳</span>";

    try {
      await supabase.insert("random_airdrop", {
        sol_address: solAddress,
        x_username: xUsername,
        telegram_username: tgUsername
      });

      // Show success
      document.getElementById("randomForm").style.display = "none";
      const success = document.getElementById("randomSuccess");
      success.style.display = "block";
      success.classList.add("visible");

      // Show congrats modal
      showCongratsModal();

      // Sync spot countdown
      syncAirdropStats();
    } catch (err) {
      submitRandomBtn.disabled = false;
      submitRandomBtn.innerHTML = "Submit Entry <span>→</span>";

      if (err.message === "DUPLICATE") {
        alert("⚠️ This SOL address or Telegram username has already been registered for the random airdrop.");
      } else if (err.message === "AIRDROP_FULL") {
        alert("🔒 Sorry! All 1,000 spots have already been filled.");
        syncAirdropStats();
      } else {
        alert("❌ Something went wrong. Please try again.\n\n" + err.message);
      }
    }
  });
}

// ══════════════════════════════════════════
// TERMS & CONDITIONS MODAL
// ══════════════════════════════════════════
const termsModal = document.getElementById("termsModal");
const closeTermsModal = document.getElementById("closeTermsModal");
const acceptTermsModal = document.getElementById("acceptTermsModal");

// Open modal triggers (both pages)
document.querySelectorAll(".terms-modal-trigger").forEach(btn => {
  btn.addEventListener("click", () => {
    if (termsModal) termsModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  });
});

function closeTermsBox() {
  if (termsModal) termsModal.style.display = "none";
  document.body.style.overflow = "";
}

if (closeTermsModal) closeTermsModal.addEventListener("click", closeTermsBox);
if (acceptTermsModal) {
  acceptTermsModal.addEventListener("click", () => {
    // Auto-check the agree checkbox when user clicks "I Understand"
    const tgCheck = document.getElementById("tgAgreeTerms");
    const rdCheck = document.getElementById("rdAgreeTerms");
    if (tgCheck) tgCheck.checked = true;
    if (rdCheck) rdCheck.checked = true;
    // Hide terms error if visible
    const tgErr = document.getElementById("tgTermsError");
    const rdErr = document.getElementById("rdTermsError");
    if (tgErr) tgErr.style.display = "none";
    if (rdErr) rdErr.style.display = "none";
    closeTermsBox();
  });
}

// Close modal on overlay click
if (termsModal) {
  termsModal.addEventListener("click", (e) => {
    if (e.target === termsModal) closeTermsBox();
  });
}

// ══════════════════════════════════════════
// CONGRATULATIONS MODAL
// ══════════════════════════════════════════
function showCongratsModal() {
  const modal = document.getElementById("congratsModal");
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

const closeCongrats = document.getElementById("closeCongrats");
if (closeCongrats) {
  closeCongrats.addEventListener("click", () => {
    const modal = document.getElementById("congratsModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
    window.location.href = "index.html";
  });
}

// Close congrats on overlay click
const congratsModal = document.getElementById("congratsModal");
if (congratsModal) {
  congratsModal.addEventListener("click", (e) => {
    if (e.target === congratsModal) {
      congratsModal.style.display = "none";
      document.body.style.overflow = "";
    }
  });
}

// Close modals on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (typeof termsModal !== "undefined" && termsModal && termsModal.style.display === "flex") closeTermsBox();
    if (typeof congratsModal !== "undefined" && congratsModal && congratsModal.style.display === "flex") {
      congratsModal.style.display = "none";
      document.body.style.overflow = "";
    }
    if (typeof galleryLightbox !== "undefined" && galleryLightbox && galleryLightbox.style.display === "flex") {
      closeGalleryLightbox();
    }
  }
});

// ══════════════════════════════════════════
// ANNOUNCEMENTS FILTER
// ══════════════════════════════════════════
const announcementFilterBtns = document.querySelectorAll(".announcements-filter-bar .filter-btn");
const announcementCards = document.querySelectorAll(".announcements-grid .announcement-card");

if (announcementFilterBtns.length && announcementCards.length) {
  announcementFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      announcementFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      announcementCards.forEach((card) => {
        const category = card.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ══════════════════════════════════════════
// COMMUNITY GALLERY (FILTER, LIKES, LIGHTBOX)
// ══════════════════════════════════════════
const galleryFilterBtns = document.querySelectorAll(".gallery-filter-bar .filter-btn");
const galleryCards = document.querySelectorAll(".gallery-grid .gallery-card");

// Gallery filter
if (galleryFilterBtns.length && galleryCards.length) {
  galleryFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      galleryFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-gallery-filter");

      galleryCards.forEach((card) => {
        const category = card.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// Gallery likes system with localStorage
const LIKES_KEY = "memetek_gallery_likes_v1";
let userLikes = {};
try {
  userLikes = JSON.parse(localStorage.getItem(LIKES_KEY) || "{}");
} catch {
  userLikes = {};
}

function updateLikeButton(button, isLiked, count) {
  if (isLiked) {
    button.classList.add("liked");
  } else {
    button.classList.remove("liked");
  }
  const countEl = button.querySelector(".like-count");
  if (countEl) countEl.textContent = count;
}

document.querySelectorAll(".gallery-card .like-btn").forEach((btn) => {
  const itemId = btn.getAttribute("data-item-id");
  const baseCount = parseInt(btn.querySelector(".like-count")?.textContent || "0", 10);
  
  if (userLikes[itemId]) {
    updateLikeButton(btn, true, baseCount + 1);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const currentlyLiked = !!userLikes[itemId];
    const newLiked = !currentlyLiked;
    userLikes[itemId] = newLiked;
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(userLikes));
    } catch {}

    const newCount = baseCount + (newLiked ? 1 : 0);
    updateLikeButton(btn, newLiked, newCount);

    if (activeLightboxItemId === itemId) {
      updateLightboxLikeBtn(newLiked, newCount);
    }
  });
});

// Gallery Lightbox
const galleryLightbox = document.getElementById("galleryLightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxBadge = document.getElementById("lightboxBadge");
const lightboxCreator = document.getElementById("lightboxCreator");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxLikeBtn = document.getElementById("lightboxLikeBtn");
const lightboxShareBtn = document.getElementById("lightboxShareBtn");
let activeLightboxItemId = null;

function updateLightboxLikeBtn(isLiked, count) {
  if (!lightboxLikeBtn) return;
  if (isLiked) {
    lightboxLikeBtn.classList.add("liked");
    lightboxLikeBtn.innerHTML = `<span>♥</span> Liked (${count})`;
  } else {
    lightboxLikeBtn.classList.remove("liked");
    lightboxLikeBtn.innerHTML = `<span>♥</span> Like This Piece (<span id="lightboxLikeCount">${count}</span>)`;
  }
}

function openGalleryLightbox(card) {
  if (!galleryLightbox) return;
  const media = card.querySelector(".gallery-media img");
  const badge = card.querySelector(".gallery-card-badge");
  const creator = card.querySelector(".creator-name");
  const title = card.querySelector(".gallery-info h3");
  const caption = card.querySelector(".gallery-info p");
  const likeBtn = card.querySelector(".like-btn");
  const itemId = likeBtn ? likeBtn.getAttribute("data-item-id") : null;
  const currentCount = likeBtn ? parseInt(likeBtn.querySelector(".like-count")?.textContent || "0", 10) : 0;
  const isLiked = likeBtn ? likeBtn.classList.contains("liked") : false;

  activeLightboxItemId = itemId;
  if (lightboxImg && media) {
    lightboxImg.src = media.getAttribute("src") || "";
    lightboxImg.alt = media.getAttribute("alt") || "";
  }
  if (lightboxBadge && badge) lightboxBadge.textContent = badge.textContent;
  if (lightboxCreator && creator) lightboxCreator.textContent = creator.textContent;
  if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
  if (lightboxCaption && caption) lightboxCaption.textContent = caption.textContent;

  updateLightboxLikeBtn(isLiked, currentCount);

  if (lightboxShareBtn && title) {
    const text = encodeURIComponent(`Check out "${title.textContent}" on @MEMETEK Community Gallery! 🚀 #MEMETEK #Solana`);
    lightboxShareBtn.href = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.origin + window.location.pathname)}`;
  }

  galleryLightbox.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
  if (!galleryLightbox) return;
  galleryLightbox.style.display = "none";
  document.body.style.overflow = "";
  activeLightboxItemId = null;
}

if (galleryCards.length && galleryLightbox) {
  galleryCards.forEach((card) => {
    const media = card.querySelector(".gallery-media");
    if (media) {
      media.addEventListener("click", () => openGalleryLightbox(card));
      media.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openGalleryLightbox(card);
        }
      });
    }
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeGalleryLightbox);
  }

  galleryLightbox.addEventListener("click", (e) => {
    if (e.target === galleryLightbox) closeGalleryLightbox();
  });

  if (lightboxLikeBtn) {
    lightboxLikeBtn.addEventListener("click", () => {
      if (!activeLightboxItemId) return;
      const matchingBtn = document.querySelector(`.like-btn[data-item-id="${activeLightboxItemId}"]`);
      if (matchingBtn) {
        matchingBtn.click();
      }
    });
  }
}

// ══════════════════════════════════════════
// FAQ ACCORDION & CATEGORY FILTER
// ══════════════════════════════════════════
const faqItems = document.querySelectorAll(".faq-accordion .faq-item");
const faqFilterBtns = document.querySelectorAll(".faq-filter-bar .filter-btn");

if (faqItems.length) {
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    const answerPanel = item.querySelector(".faq-answer");

    if (questionBtn && answerPanel) {
      questionBtn.addEventListener("click", () => {
        const isOpen = item.classList.contains("active");

        // Close other FAQ items for a clean accordion effect
        faqItems.forEach((other) => {
          if (other !== item && other.classList.contains("active")) {
            other.classList.remove("active");
            const otherBtn = other.querySelector(".faq-question");
            const otherAns = other.querySelector(".faq-answer");
            if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
            if (otherAns) otherAns.style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove("active");
          questionBtn.setAttribute("aria-expanded", "false");
          answerPanel.style.maxHeight = null;
        } else {
          item.classList.add("active");
          questionBtn.setAttribute("aria-expanded", "true");
          answerPanel.style.maxHeight = (answerPanel.scrollHeight + 30) + "px";
        }
      });
    }
  });
}

// FAQ category filter
if (faqFilterBtns.length && faqItems.length) {
  faqFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      faqFilterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-faq-filter");

      faqItems.forEach((item) => {
        const category = item.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          item.style.display = "";
        } else {
          item.style.display = "none";
          item.classList.remove("active");
          const qBtn = item.querySelector(".faq-question");
          const ans = item.querySelector(".faq-answer");
          if (qBtn) qBtn.setAttribute("aria-expanded", "false");
          if (ans) ans.style.maxHeight = null;
        }
      });
    });
  });
}
