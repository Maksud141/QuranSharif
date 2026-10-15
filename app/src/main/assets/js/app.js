/* =========================================================
   QURAN SHARIF — MAIN APP.JS
   ---------------------------------------------------------
   • Page Navigation
   • Android Back Button / Browser Back
   • Drawer Navigation
   • Bottom Navigation
   • Live Clock (12-hour AM/PM)
   • Bangla Date
   • Search Navigation
   • Last Read / Continue Reading
   • Dua Navigation
   • Separate Quran and Dua Bookmarks
   ---------------------------------------------------------
   Prayer / Location / Qibla:
   js/prayer-location-qibla.js
========================================================= */

"use strict";


/* =========================================================
   DOM HELPERS
========================================================= */

function appElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   GLOBAL ELEMENTS
========================================================= */

const menuBtn = appElement("menuBtn");
const drawer = appElement("drawer");
const drawerOverlay = appElement("drawerOverlay");
const closeDrawerBtn = appElement("closeDrawerBtn");

const homeDuaBtn = appElement("homeDuaBtn");
const openQuranBtn = appElement("openQuranBtn");
const searchBtn = appElement("searchBtn");
const lastReadBtn = appElement("lastReadBtn");


/* =========================================================
   CURRENT PAGE
========================================================= */

let currentPageId = "homePage";


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId, saveHistory = true) {
    const targetPage = appElement(pageId);

    if (!targetPage) {
        console.warn("Page not found:", pageId);
        return;
    }

    /* -----------------------------------------
       HIDE ALL PAGES
    ----------------------------------------- */

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    /* -----------------------------------------
       SHOW TARGET PAGE
    ----------------------------------------- */

    targetPage.classList.add("active");
    currentPageId = pageId;

    /* -----------------------------------------
       BOTTOM NAV ACTIVE STATE
    ----------------------------------------- */

    document.querySelectorAll(".bottom-nav-btn").forEach(button => {
        button.classList.remove("active");
    });

    document.querySelectorAll("[data-page]").forEach(button => {
        if (button.dataset.page === pageId) {
            button.classList.add("active");
        }
    });

    /* -----------------------------------------
       PAGE-SPECIFIC ACTIONS
    ----------------------------------------- */

    // বুকমার্ক পেজে একবারই দোয়ার বুকমার্ক রেন্ডার হবে।
    // কুরআনের #bookmarkList পরিবর্তন করবে না।
    if (pageId === "bookmarkPage") {
        if (typeof window.renderDuaBookmarks === "function") {
            window.renderDuaBookmarks();
        }
    }

    // নামাজের সময় আপডেট
    if (pageId === "prayerPage") {
        const prayer = window.QuranSharifPrayer;

        if (prayer && typeof prayer.refresh === "function") {
            prayer.refresh();
        }
    }

    // লোকেশন পেজ আপডেট
    if (pageId === "locationPage") {
        const prayer = window.QuranSharifPrayer;

        if (
            prayer &&
            typeof prayer.refreshLocationPage === "function"
        ) {
            prayer.refreshLocationPage();
        }
    }

    // হোম পেজে শেষ পড়া আপডেট
    if (pageId === "homePage") {
        loadLastRead();
    }

    /* -----------------------------------------
       SAVE BROWSER / ANDROID BACK HISTORY
    ----------------------------------------- */

    if (saveHistory) {
        const state = window.history.state;

        if (
            !state ||
            state.page !== pageId ||
            state.drawer === true
        ) {
            window.history.pushState(
                { page: pageId },
                "",
                ""
            );
        }
    }

    /* -----------------------------------------
       CLOSE DRAWER WITHOUT EXTRA HISTORY
    ----------------------------------------- */

    closeDrawer(false);
}


/* =========================================================
   GLOBAL PAGE FUNCTION
========================================================= */

window.showPage = showPage;


/* =========================================================
   INITIAL HISTORY
========================================================= */

if (!window.history.state || !window.history.state.page) {
    window.history.replaceState(
        { page: "homePage" },
        "",
        ""
    );
}


/* =========================================================
   ANDROID BACK BUTTON / BROWSER BACK
========================================================= */

window.addEventListener("popstate", function (event) {
    // Drawer খোলা থাকলে Back চাপলে আগে Drawer বন্ধ হবে।
    if (drawer && drawer.classList.contains("open")) {
        closeDrawer(false);
        return;
    }

    const state = event.state;

    if (state && state.drawer === true) {
        closeDrawer(false);
        return;
    }

    if (state && state.page && appElement(state.page)) {
        showPage(state.page, false);
        return;
    }

    // বৈধ history state না থাকলে Home পেজ।
    showPage("homePage", false);
});


/* =========================================================
   DRAWER OPEN
========================================================= */

function openDrawer() {
    if (!drawer || !drawerOverlay) {
        return;
    }

    drawer.classList.add("open");
    drawerOverlay.classList.add("active");

    const state = window.history.state;

    if (!state || state.drawer !== true) {
        window.history.pushState(
            {
                page: currentPageId,
                drawer: true
            },
            "",
            ""
        );
    }
}


/* =========================================================
   DRAWER CLOSE
========================================================= */

function closeDrawer(removeHistory = true) {
    if (drawer) {
        drawer.classList.remove("open");
    }

    if (drawerOverlay) {
        drawerOverlay.classList.remove("active");
    }

    // Close button / overlay থেকে বন্ধ করলে Drawer history সরাও।
    if (
        removeHistory &&
        window.history.state &&
        window.history.state.drawer === true
    ) {
        window.history.back();
    }
}


/* =========================================================
   GLOBAL DRAWER FUNCTIONS
========================================================= */

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;


/* =========================================================
   DRAWER BUTTON EVENTS
========================================================= */

if (menuBtn) {
    menuBtn.addEventListener("click", openDrawer);
}

if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener("click", function () {
        closeDrawer(true);
    });
}

if (drawerOverlay) {
    drawerOverlay.addEventListener("click", function () {
        closeDrawer(true);
    });
}


/* =========================================================
   DATA-PAGE NAVIGATION
========================================================= */

document.querySelectorAll("[data-page]").forEach(button => {
    // Home Dua button-এর জন্য নিচে আলাদা event আছে।
    // একই button-এ দুইবার navigation এড়ানো হচ্ছে।
    if (button.id === "homeDuaBtn") {
        return;
    }

    button.addEventListener("click", function () {
        const pageId = button.dataset.page;

        if (!pageId) {
            return;
        }

        showPage(pageId);
    });
});


/* =========================================================
   DUA HOME BUTTON
========================================================= */

if (homeDuaBtn) {
    homeDuaBtn.addEventListener("click", function () {
        showPage("duaPage");

        if (typeof window.loadDuaCategories === "function") {
            window.loadDuaCategories();
        }
    });
}


/* =========================================================
   QURAN HOME BUTTON
========================================================= */

if (openQuranBtn) {
    openQuranBtn.addEventListener("click", function () {
        showPage("quranPage");
    });
}


/* =========================================================
   SEARCH BUTTON
========================================================= */

if (searchBtn) {
    searchBtn.addEventListener("click", function () {
        showPage("searchPage");
    });
}


/* =========================================================
   LIVE CLOCK — 12 HOUR + AM/PM
========================================================= */

function updateClock() {
    const now = new Date();

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
        hours = 12;
    }

    const hourText = String(hours).padStart(2, "0");
    const minuteText = String(minutes).padStart(2, "0");
    const secondText = String(seconds).padStart(2, "0");

    const liveTime = appElement("liveTime");

    if (liveTime) {
        liveTime.textContent =
            `${hourText}:${minuteText}:${secondText} ${ampm}`;
    }
}


/* =========================================================
   CLOCK START
========================================================= */

updateClock();

setInterval(updateClock, 1000);


/* =========================================================
   BANGLA DATE
========================================================= */

function updateDate() {
    const now = new Date();

    const date = now.toLocaleDateString("bn-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const todayDate = appElement("todayDate");

    if (todayDate) {
        todayDate.textContent = date;
    }
}


/* =========================================================
   INITIAL DATE
========================================================= */

updateDate();


/* =========================================================
   LAST READ — LOAD DATA
========================================================= */

function getLastReadData() {
    try {
        const raw = localStorage.getItem("quranLastRead");

        if (!raw) {
            return null;
        }

        const data = JSON.parse(raw);

        if (!data || !data.surah || !data.ayah) {
            return null;
        }

        const surah = Number(data.surah);
        const ayah = Number(data.ayah);

        if (
            !Number.isInteger(surah) ||
            !Number.isInteger(ayah) ||
            surah < 1 ||
            surah > 114 ||
            ayah < 1
        ) {
            return null;
        }

        return {
            ...data,
            surah,
            ayah
        };
    } catch (error) {
        console.warn("Last read data error:", error);
        return null;
    }
}


/* =========================================================
   LAST READ — DISPLAY ON HOME
========================================================= */

function loadLastRead() {
    const lastReadSurah = appElement("lastReadSurah");
    const lastReadAyah = appElement("lastReadAyah");

    if (!lastReadSurah || !lastReadAyah) {
        return;
    }

    const lastRead = getLastReadData();

    if (!lastRead) {
        lastReadSurah.textContent = "কোনো পড়া সংরক্ষণ করা হয়নি";
        lastReadAyah.textContent = "";
        return;
    }

    const surahSelect = appElement("surahSelect");

    let surahName = `সূরা ${lastRead.surah}`;

    if (surahSelect) {
        const option = Array.from(surahSelect.options).find(item => {
            return Number(item.value) === lastRead.surah;
        });

        if (option) {
            surahName = option.textContent.trim();
        }
    }

    lastReadSurah.textContent = surahName;
    lastReadAyah.textContent = `আয়াত ${lastRead.ayah}`;
}


/* =========================================================
   LAST READ — OPEN EXACT AYAH
========================================================= */

let lastReadOpenRequest = 0;

async function openLastRead() {
    const requestId = ++lastReadOpenRequest;
    const lastRead = getLastReadData();

    if (!lastRead) {
        alert("এখনও কোনো আয়াত পড়া সংরক্ষণ করা হয়নি।");
        return;
    }

    showPage("quranPage");

    const surahSelect = appElement("surahSelect");
    const ayahSelect = appElement("ayahSelect");

    if (surahSelect) {
        surahSelect.value = String(lastRead.surah);

        // Quran module-কে সূরা পরিবর্তনের খবর দাও।
        surahSelect.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    }

    // সূরার আয়াতের তালিকা লোড হওয়ার জন্য অপেক্ষা।
    await new Promise(resolve => setTimeout(resolve, 350));

    if (requestId !== lastReadOpenRequest) {
        return;
    }

    if (ayahSelect) {
        ayahSelect.value = String(lastRead.ayah);
    }

    // loadSurah থাকলে নির্দিষ্ট আয়াতসহ লোড করবে।
    if (typeof window.loadSurah === "function") {
        window.loadSurah(lastRead.surah, lastRead.ayah);
        return;
    }

    // বিকল্প হিসেবে GO বাটন ব্যবহার।
    const goAyahBtn = appElement("goAyahBtn");

    if (goAyahBtn) {
        goAyahBtn.click();
    }
}


/* =========================================================
   LAST READ BUTTON
========================================================= */

if (lastReadBtn) {
    lastReadBtn.addEventListener("click", openLastRead);
}


/* =========================================================
   GLOBAL LAST READ HELPERS
========================================================= */

window.loadLastRead = loadLastRead;
window.openLastRead = openLastRead;


/* =========================================================
   UPDATE HOME DATA WHEN APP RETURNS TO FOREGROUND
========================================================= */

window.addEventListener("focus", function () {
    loadLastRead();
    updateClock();
    updateDate();
});


document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        loadLastRead();
        updateClock();
        updateDate();
    }
});


/* =========================================================
   INITIAL PAGE CHECK
========================================================= */

function initializeAppPage() {
    const activePage = document.querySelector(".page.active");

    if (!activePage) {
        showPage("homePage", false);
    } else {
        currentPageId = activePage.id || "homePage";
    }

    loadLastRead();
    updateClock();
    updateDate();
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAppPage,
        { once: true }
    );
} else {
    initializeAppPage();
}


/* =========================================================
   APP.JS END
========================================================= */