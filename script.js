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
  ".principle-card, .culture-visual, .culture-copy, .community-panel, .airdrop-card, .ca-banner-inner, .form-container"
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

    if (!solAddress || !xUsername || !tgUsername) {
      alert("Please fill in all fields.");
      return;
    }

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

    if (!solAddress || !xUsername || !tgUsername) {
      alert("Please fill in all fields.");
      return;
    }

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
