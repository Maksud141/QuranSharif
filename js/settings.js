/* =====================================================
   QURAN SHARIF
   SETTINGS SYSTEM
===================================================== */

(function () {

    "use strict";


    /* =====================================================
       DEFAULT SETTINGS
    ===================================================== */

    const DEFAULT_SETTINGS = {

        theme: "light",

        arabicFontSize: 28,

        banglaFontSize: 16,

        audioVolume: 100,

        audioAutoPlay: false,

        showTranslation: true,

        keepScreenOn: false

    };


    const SETTINGS_KEY =
        "quranAppSettings";


    let settings = {
        ...DEFAULT_SETTINGS
    };


    let wakeLock = null;


    /* =====================================================
       LOAD SETTINGS
    ===================================================== */

    function loadSettings() {

        try {

            const saved =
                localStorage.getItem(
                    SETTINGS_KEY
                );


            if (saved) {

                const parsed =
                    JSON.parse(saved);


                settings = {
                    ...DEFAULT_SETTINGS,
                    ...parsed
                };

            }

        } catch (error) {

            console.error(
                "Settings load error:",
                error
            );

            settings = {
                ...DEFAULT_SETTINGS
            };

        }


        applySettings();

    }


    /* =====================================================
       SAVE SETTINGS
    ===================================================== */

    function saveSettings() {

        try {

            localStorage.setItem(
                SETTINGS_KEY,
                JSON.stringify(settings)
            );

        } catch (error) {

            console.error(
                "Settings save error:",
                error
            );

        }

    }


    /* =====================================================
       APPLY ALL SETTINGS
    ===================================================== */

    function applySettings() {

        const body =
            document.body;


        if (!body) {
            return;
        }


        /* =========================
           THEME
        ========================== */

        if (
            settings.theme ===
            "dark"
        ) {

            body.classList.add(
                "dark-mode"
            );

        } else {

            body.classList.remove(
                "dark-mode"
            );

        }


        /* =========================
           ARABIC FONT
        ========================== */

        body.style.setProperty(
            "--arabic-font-size",
            settings.arabicFontSize + "px"
        );


        /* =========================
           BANGLA FONT
        ========================== */

        body.style.setProperty(
            "--bangla-font-size",
            settings.banglaFontSize + "px"
        );


        /* =========================
           TRANSLATION
        ========================== */

        if (
            settings.showTranslation
        ) {

            body.classList.remove(
                "hide-translation"
            );

        } else {

            body.classList.add(
                "hide-translation"
            );

        }


        /* =========================
           AUDIO
        ========================== */

        applyAudioVolume();


        /* =========================
           SCREEN WAKE LOCK
        ========================== */

        if (
            settings.keepScreenOn
        ) {

            requestWakeLock();

        } else {

            releaseWakeLock();

        }


        updateSettingsUI();

    }


    /* =====================================================
       AUDIO VOLUME
    ===================================================== */

    function applyAudioVolume() {

        try {

            if (
                typeof quranAudio !==
                "undefined" &&
                quranAudio
            ) {

                quranAudio.volume =
                    settings.audioVolume / 100;

            }

        } catch (error) {

            console.log(
                "Audio volume apply হয়নি"
            );

        }

    }


    /* =====================================================
       UPDATE SETTINGS UI
    ===================================================== */

    function updateSettingsUI() {


        const themeSetting =
            document.getElementById(
                "themeSetting"
            );


        if (themeSetting) {

            themeSetting.value =
                settings.theme;

        }


        const arabicFontValue =
            document.getElementById(
                "arabicFontValue"
            );


        if (arabicFontValue) {

            arabicFontValue.textContent =
                settings.arabicFontSize + "px";

        }


        const banglaFontValue =
            document.getElementById(
                "banglaFontValue"
            );


        if (banglaFontValue) {

            banglaFontValue.textContent =
                settings.banglaFontSize + "px";

        }


        const audioVolume =
            document.getElementById(
                "audioVolume"
            );


        if (audioVolume) {

            audioVolume.value =
                settings.audioVolume;

        }


        const audioAutoPlay =
            document.getElementById(
                "audioAutoPlay"
            );


        if (audioAutoPlay) {

            audioAutoPlay.checked =
                settings.audioAutoPlay;

        }


        const showTranslation =
            document.getElementById(
                "showTranslation"
            );


        if (showTranslation) {

            showTranslation.checked =
                settings.showTranslation;

        }


        const keepScreenOn =
            document.getElementById(
                "keepScreenOn"
            );


        if (keepScreenOn) {

            keepScreenOn.checked =
                settings.keepScreenOn;

        }

    }


    /* =====================================================
       THEME
    ===================================================== */

    function setupTheme() {

        const themeSetting =
            document.getElementById(
                "themeSetting"
            );


        if (!themeSetting) {
            return;
        }


        themeSetting.addEventListener(
            "change",
            function () {

                settings.theme =
                    this.value;

                saveSettings();

                applySettings();

            }
        );

    }


    /* =====================================================
       ARABIC FONT SIZE
    ===================================================== */

    function setupArabicFont() {

        const minus =
            document.getElementById(
                "arabicFontMinus"
            );


        const plus =
            document.getElementById(
                "arabicFontPlus"
            );


        if (minus) {

            minus.addEventListener(
                "click",
                function () {

                    settings.arabicFontSize =
                        Math.max(
                            18,
                            settings.arabicFontSize - 2
                        );


                    saveSettings();

                    applySettings();

                }
            );

        }


        if (plus) {

            plus.addEventListener(
                "click",
                function () {

                    settings.arabicFontSize =
                        Math.min(
                            60,
                            settings.arabicFontSize + 2
                        );


                    saveSettings();

                    applySettings();

                }
            );

        }

    }


    /* =====================================================
       BANGLA FONT SIZE
    ===================================================== */

    function setupBanglaFont() {

        const minus =
            document.getElementById(
                "banglaFontMinus"
            );


        const plus =
            document.getElementById(
                "banglaFontPlus"
            );


        if (minus) {

            minus.addEventListener(
                "click",
                function () {

                    settings.banglaFontSize =
                        Math.max(
                            12,
                            settings.banglaFontSize - 1
                        );


                    saveSettings();

                    applySettings();

                }
            );

        }


        if (plus) {

            plus.addEventListener(
                "click",
                function () {

                    settings.banglaFontSize =
                        Math.min(
                            32,
                            settings.banglaFontSize + 1
                        );


                    saveSettings();

                    applySettings();

                }
            );

        }

    }


    /* =====================================================
       AUDIO SETTINGS
    ===================================================== */

    function setupAudio() {

        const volume =
            document.getElementById(
                "audioVolume"
            );


        if (volume) {

            volume.addEventListener(
                "input",
                function () {

                    settings.audioVolume =
                        Number(
                            this.value
                        );


                    saveSettings();

                    applyAudioVolume();

                }
            );

        }


        const autoPlay =
            document.getElementById(
                "audioAutoPlay"
            );


        if (autoPlay) {

            autoPlay.addEventListener(
                "change",
                function () {

                    settings.audioAutoPlay =
                        this.checked;

                    saveSettings();

                }
            );

        }

    }


    /* =====================================================
       TRANSLATION SETTING
    ===================================================== */

    function setupTranslation() {

        const checkbox =
            document.getElementById(
                "showTranslation"
            );


        if (!checkbox) {
            return;
        }


        checkbox.addEventListener(
            "change",
            function () {

                settings.showTranslation =
                    this.checked;

                saveSettings();

                applySettings();

            }
        );

    }


    /* =====================================================
       KEEP SCREEN ON
    ===================================================== */

    function setupScreenLock() {

        const checkbox =
            document.getElementById(
                "keepScreenOn"
            );


        if (!checkbox) {
            return;
        }


        checkbox.addEventListener(
            "change",
            function () {

                settings.keepScreenOn =
                    this.checked;

                saveSettings();

                applySettings();

            }
        );

    }


    /* =====================================================
       WAKE LOCK
    ===================================================== */

    async function requestWakeLock() {

        if (
            !("wakeLock" in navigator)
        ) {

            console.log(
                "Wake Lock এই ডিভাইসে নেই"
            );

            return;

        }


        try {

            wakeLock =
                await navigator.wakeLock.request(
                    "screen"
                );


            wakeLock.addEventListener(
                "release",
                function () {

                    wakeLock = null;

                }
            );


        } catch (error) {

            console.log(
                "Screen Wake Lock চালু হয়নি:",
                error
            );

        }

    }


    /* =====================================================
       RELEASE WAKE LOCK
    ===================================================== */

    async function releaseWakeLock() {

        if (!wakeLock) {
            return;
        }


        try {

            await wakeLock.release();

            wakeLock = null;

        } catch (error) {

            console.log(
                "Wake Lock বন্ধ করা যায়নি"
            );

        }

    }


    /* =====================================================
       RESET SETTINGS
    ===================================================== */

    function setupReset() {

        const resetButton =
            document.getElementById(
                "resetSettingsBtn"
            );


        if (!resetButton) {
            return;
        }


        resetButton.addEventListener(
            "click",
            function () {

                const confirmReset =
                    confirm(
                        "সব Settings কি Default অবস্থায় ফিরিয়ে দিতে চান?"
                    );


                if (!confirmReset) {
                    return;
                }


                settings = {
                    ...DEFAULT_SETTINGS
                };


                saveSettings();

                applySettings();

            }
        );

    }


    /* =====================================================
       SCREEN VISIBILITY
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible" &&
                settings.keepScreenOn
            ) {

                requestWakeLock();

            }

        }
    );


    /* =====================================================
       PUBLIC AUTO PLAY CHECK
    ===================================================== */

    window.shouldAutoPlayAudio =
        function () {

            return Boolean(
                settings.audioAutoPlay
            );

        };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initSettings() {

        loadSettings();

        setupTheme();

        setupArabicFont();

        setupBanglaFont();

        setupAudio();

        setupTranslation();

        setupScreenLock();

        setupReset();

        updateSettingsUI();

    }


    /* =====================================================
       DOM READY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSettings
        );

    } else {

        initSettings();

    }


})();