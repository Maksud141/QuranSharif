/* =========================================================
   QURAN SHARIF — MAIN APP.JS
   ---------------------------------------------------------
   • Page Navigation
   • Android Back Button / Browser Back
   • Drawer
   • Bottom Navigation
   • Live Clock
   • Date
   • Search
   • Last Read
   • Home Navigation
   ---------------------------------------------------------
   Prayer / Location / Qibla system is handled by:
   js/prayer-location-qibla.js
========================================================= */


/* =========================================================
   GLOBAL PAGE ELEMENTS
========================================================= */

const pages = document.querySelectorAll(".page");

const menuBtn =
    document.getElementById("menuBtn");

const drawer =
    document.getElementById("drawer");

const drawerOverlay =
    document.getElementById("drawerOverlay");

const closeDrawerBtn =
    document.getElementById("closeDrawerBtn");

const homeDuaBtn =
    document.getElementById("homeDuaBtn");


/* =========================================================
   CURRENT PAGE
========================================================= */

let currentPageId = "homePage";


/* =========================================================
   DUA HOME BUTTON
========================================================= */

if (homeDuaBtn) {

    homeDuaBtn.addEventListener(
        "click",
        function () {

            showPage("duaPage");

            if (
                typeof loadDuaCategories ===
                "function"
            ) {

                loadDuaCategories();

            }

        }
    );

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(
    pageId,
    saveHistory = true
) {

    const page =
        document.getElementById(pageId);


    /* =========================
       PAGE EXISTS?
    ========================= */

    if (!page) {

        console.warn(
            "Page not found:",
            pageId
        );

        return;

    }


    /* =========================
       HIDE ALL PAGES
    ========================= */

    pages.forEach(
        function (item) {

            item.classList.remove(
                "active"
            );

        }
    );


    /* =========================
       SHOW TARGET PAGE
    ========================= */

    page.classList.add("active");


    currentPageId =
        pageId;


    /* =========================
       BOTTOM NAV ACTIVE
    ========================= */

    document
        .querySelectorAll(
            ".bottom-nav-btn"
        )
        .forEach(
            function (btn) {

                btn.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            `[data-page="${pageId}"]`
        )
        .forEach(
            function (btn) {

                btn.classList.add(
                    "active"
                );

            }
        );


    /* =========================
       PAGE-SPECIFIC ACTIONS
    ========================= */

    /* Prayer page */

    if (
        pageId === "prayerPage"
    ) {

        if (
            window.QuranSharifPrayer &&
            typeof window.QuranSharifPrayer
                .refresh === "function"
        ) {

            window.QuranSharifPrayer.refresh();

        }

    }


    /* Location page */

    if (
        pageId === "locationPage"
    ) {

        if (
            window.QuranSharifPrayer &&
            typeof window.QuranSharifPrayer
                .refreshLocationPage ===
                "function"
        ) {

            window.QuranSharifPrayer
                .refreshLocationPage();

        }

    }


    /* =========================
       SAVE HISTORY
    ========================= */

    if (saveHistory) {

        const currentState =
            window.history.state;


        if (
            !currentState ||
            currentState.page !== pageId ||
            currentState.drawer === true
        ) {

            window.history.pushState(
                {
                    page: pageId
                },
                "",
                ""
            );

        }

    }


    /* =========================
       CLOSE DRAWER
    ========================= */

    closeDrawer(false);

}


/* =========================================================
   MAKE showPage AVAILABLE GLOBALLY
   Other JS files / inline HTML can use it.
========================================================= */

window.showPage =
    showPage;


/* =========================================================
   INITIAL HISTORY
========================================================= */

window.history.replaceState(
    {
        page: "homePage"
    },
    "",
    ""
);


/* =========================================================
   ANDROID BACK BUTTON / BROWSER BACK
========================================================= */

window.addEventListener(
    "popstate",
    function (event) {


        /* =========================
           DRAWER OPEN?
           Drawer আগে বন্ধ হবে
        ========================= */

        if (
            drawer &&
            drawer.classList.contains("open")
        ) {

            closeDrawer(false);

            return;

        }


        /* =========================
           GET HISTORY STATE
        ========================= */

        const state =
            event.state;


        /* =========================
           VALID PAGE STATE
        ========================= */

        if (
            state &&
            state.page
        ) {

            showPage(
                state.page,
                false
            );

            return;

        }


        /* =========================
           NO STATE
           → HOME
        ========================= */

        showPage(
            "homePage",
            false
        );

    }
);


/* =========================================================
   DRAWER OPEN
========================================================= */

function openDrawer() {

    if (
        !drawer ||
        !drawerOverlay
    ) {

        return;

    }


    drawer.classList.add(
        "open"
    );

    drawerOverlay.classList.add(
        "active"
    );


    /* =========================
       SAVE DRAWER HISTORY
    ========================= */

    const state =
        window.history.state;


    if (
        !state ||
        state.drawer !== true
    ) {

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

function closeDrawer(
    removeHistory = true
) {

    if (drawer) {

        drawer.classList.remove(
            "open"
        );

    }


    if (drawerOverlay) {

        drawerOverlay.classList.remove(
            "active"
        );

    }


    /* =========================
       REMOVE DRAWER HISTORY
    ========================= */

    if (
        removeHistory &&
        window.history.state &&
        window.history.state.drawer === true
    ) {

        window.history.back();

    }

}


/* =========================================================
   MAKE DRAWER FUNCTIONS GLOBAL
========================================================= */

window.openDrawer =
    openDrawer;

window.closeDrawer =
    closeDrawer;


/* =========================================================
   MENU BUTTON
========================================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        function () {

            openDrawer();

        }
    );

}


/* =========================================================
   CLOSE DRAWER BUTTON
========================================================= */

if (closeDrawerBtn) {

    closeDrawerBtn.addEventListener(
        "click",
        function () {

            closeDrawer(true);

        }
    );

}


/* =========================================================
   DRAWER OVERLAY
========================================================= */

if (drawerOverlay) {

    drawerOverlay.addEventListener(
        "click",
        function () {

            closeDrawer(true);

        }
    );

}


/* =========================================================
   ALL DATA-PAGE BUTTONS
========================================================= */

document
    .querySelectorAll(
        "[data-page]"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const pageId =
                        button.dataset.page;


                    if (!pageId) {

                        return;

                    }


                    showPage(
                        pageId
                    );

                }
            );

        }
    );


/* =========================================================
   QURAN HOME BUTTON
========================================================= */

const openQuranBtn =
    document.getElementById(
        "openQuranBtn"
    );


if (openQuranBtn) {

    openQuranBtn.addEventListener(
        "click",
        function () {

            showPage(
                "quranPage"
            );

        }
    );

}


/* =========================================================
   LIVE CLOCK
   12 HOUR + AM/PM
========================================================= */

function updateClock() {

    const now =
        new Date();


    let hours =
        now.getHours();


    const minutes =
        now.getMinutes();


    const seconds =
        now.getSeconds();


    /* =========================
       AM / PM
    ========================= */

    const ampm =
        hours >= 12
            ? "PM"
            : "AM";


    /* =========================
       12 HOUR FORMAT
    ========================= */

    hours =
        hours % 12;


    if (hours === 0) {

        hours = 12;

    }


    const hourText =
        String(hours)
            .padStart(2, "0");


    const minuteText =
        String(minutes)
            .padStart(2, "0");


    const secondText =
        String(seconds)
            .padStart(2, "0");


    /* =========================
       UPDATE HOME CLOCK
    ========================= */

    const liveTime =
        document.getElementById(
            "liveTime"
        );


    if (liveTime) {

        liveTime.textContent =
            `${hourText}:${minuteText}:${secondText} ${ampm}`;

    }

}


/* =========================
   START CLOCK
========================= */

setInterval(
    updateClock,
    1000
);


updateClock();


/* =========================================================
   DATE
========================================================= */

function updateDate() {

    const now =
        new Date();


    const date =
        now.toLocaleDateString(
            "bn-BD",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );


    const todayDate =
        document.getElementById(
            "todayDate"
        );


    if (todayDate) {

        todayDate.textContent =
            date;

    }

}


/* =========================
   INITIAL DATE
========================= */

updateDate();


/* =========================================================
   SEARCH BUTTON
========================================================= */

const searchBtn =
    document.getElementById(
        "searchBtn"
    );


if (searchBtn) {

    searchBtn.addEventListener(
        "click",
        function () {

            showPage(
                "searchPage"
            );

        }
    );

}


/* =========================================================
   LAST READ
========================================================= */

function loadLastRead() {

    const lastReadSurah =
        document.getElementById(
            "lastReadSurah"
        );


    const lastReadAyah =
        document.getElementById(
            "lastReadAyah"
        );


    /* =========================
       ELEMENTS CHECK
    ========================= */

    if (
        !lastReadSurah ||
        !lastReadAyah
    ) {

        return;

    }


    let lastRead =
        null;


    /* =========================
       READ LOCAL STORAGE
    ========================= */

    try {

        lastRead =
            JSON.parse(
                localStorage.getItem(
                    "quranLastRead"
                )
            );

    } catch (error) {

        console.warn(
            "Last read data error:",
            error
        );

        lastRead =
            null;

    }


    /* =========================
       NO LAST READ
    ========================= */

    if (
        !lastRead ||
        !lastRead.surah ||
        !lastRead.ayah
    ) {

        lastReadSurah.textContent =
            "কোনো পড়া সংরক্ষণ করা হয়নি";


        lastReadAyah.textContent =
            "";


        return;

    }


    const surahNumber =
        Number(
            lastRead.surah
        );


    const ayahNumber =
        Number(
            lastRead.ayah
        );


    /* =========================
       SURAH SELECT
    ========================= */

    const surahSelect =
        document.getElementById(
            "surahSelect"
        );


    let surahName =
        `সূরা ${surahNumber}`;


    if (surahSelect) {

        const option =
            surahSelect.querySelector(
                `option[value="${surahNumber}"]`
            );


        if (option) {

            surahName =
                option.textContent.trim();

        }

    }


    /* =========================
       DISPLAY
    ========================= */

    lastReadSurah.textContent =
        surahName;


    lastReadAyah.textContent =
        `আয়াত ${ayahNumber}`;

}


/* =========================================================
   LAST READ BUTTON
========================================================= */

const lastReadBtn =
    document.getElementById(
        "lastReadBtn"
    );


if (lastReadBtn) {

    lastReadBtn.addEventListener(
        "click",
        function () {


            let lastRead =
                null;


            /* =========================
               READ LAST READ
            ========================= */

            try {

                lastRead =
                    JSON.parse(
                        localStorage.getItem(
                            "quranLastRead"
                        )
                    );

            } catch (error) {

                console.warn(
                    "Last read data error:",
                    error
                );

                lastRead =
                    null;

            }


            /* =========================
               NO DATA
            ========================= */

            if (
                !lastRead ||
                !lastRead.surah ||
                !lastRead.ayah
            ) {

                return;

            }


            const surahNumber =
                Number(
                    lastRead.surah
                );


            const ayahNumber =
                Number(
                    lastRead.ayah
                );


            /* =========================
               OPEN QURAN PAGE
            ========================= */

            showPage(
                "quranPage"
            );


            /* =========================
               SURAH SELECT
            ========================= */

            const surahSelect =
                document.getElementById(
                    "surahSelect"
                );


            if (surahSelect) {

                surahSelect.value =
                    String(
                        surahNumber
                    );


                /*
                 * Quran.js-এর change
                 * event চালানো হচ্ছে
                 */

                surahSelect.dispatchEvent(
                    new Event(
                        "change"
                    )
                );

            }


            /* =========================
               OPEN EXACT AYAH
            ========================= */

            setTimeout(
                function () {


                    const ayahSelect =
                        document.getElementById(
                            "ayahSelect"
                        );


                    if (ayahSelect) {

                        ayahSelect.value =
                            String(
                                ayahNumber
                            );

                    }


                    /* =========================
                       LOAD SURAH
                    ========================= */

                    if (
                        typeof loadSurah ===
                        "function"
                    ) {

                        loadSurah(
                            surahNumber,
                            ayahNumber
                        );

                    }

                },
                300
            );

        }
    );

}


/* =========================================================
   INITIAL LAST READ LOAD
========================================================= */

setTimeout(
    loadLastRead,
    1000
);


/* =========================================================
   UPDATE LAST READ WHEN PAGE BECOMES VISIBLE
========================================================= */

window.addEventListener(
    "focus",
    function () {

        loadLastRead();

    }
);


/* =========================================================
   PAGE LOAD COMPLETE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Make sure Home page is active
         * if no other page is active.
         */

        const activePage =
            document.querySelector(
                ".page.active"
            );


        if (!activePage) {

            showPage(
                "homePage",
                false
            );

        }

    }
);


/* =========================================================
   APP.JS END
========================================================= */