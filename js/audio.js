
/* =========================================================
   QURAN SHARIF — SURAH AUDIO
   Online Streaming + IndexedDB Offline Audio
   ▶️ শুনুন ↔ ⏸️ বন্ধ
   Mobile Friendly + Download + Search + Stop
========================================================= */

(function () {
    "use strict";

    const API = "https://www.mp3quran.net/api/v3";
    const DB_NAME = "QuranSharifAudioDB";
    const STORE_NAME = "surahAudio";
    const DB_VERSION = 1;

    const $ = id => document.getElementById(id);

    const reciterSelect = $("audioReciterSelect");
    const searchInput = $("audioSurahSearch");
    const list = $("surahAudioList");
    const player = $("surahAudioPlayer");
    const playerBox = $("surahAudioPlayerBox");
    const nowPlaying = $("surahAudioNowPlaying");
    const stopBtn = $("stopSurahAudioBtn");
    const downloadAllBtn = $("downloadAllSurahsBtn");
    const cancelBtn = $("cancelAudioDownloadBtn");
    const progressBox = $("audioDownloadProgress");
    const progressBar = $("audioDownloadBar");
    const statusText = $("audioDownloadStatus");
    const summary = $("audioDownloadSummary");

    if (
        !reciterSelect || !searchInput || !list || !player ||
        !playerBox || !nowPlaying || !downloadAllBtn ||
        !cancelBtn || !progressBox || !progressBar ||
        !statusText || !summary
    ) {
        console.error("Audio page elements missing. Check index.html IDs.");
        return;
    }

    /* =====================================================
       114 SURAH NAMES
    ===================================================== */

    const surahs = [
        "الفاتحة|আল-ফাতিহা",
        "البقرة|আল-বাকারা",
        "آل عمران|আলে ইমরান",
        "النساء|আন-নিসা",
        "المائدة|আল-মায়িদা",
        "الأنعام|আল-আনআম",
        "الأعراف|আল-আরাফ",
        "الأنفال|আল-আনফাল",
        "التوبة|আত-তাওবা",
        "يونس|ইউনুস",
        "هود|হুদ",
        "يوسف|ইউসুফ",
        "الرعد|আর-রাদ",
        "إبراهيم|ইবরাহিম",
        "الحجر|আল-হিজর",
        "النحل|আন-নাহল",
        "الإسراء|বনি ইসরাইল",
        "الكهف|আল-কাহফ",
        "مريم|মারইয়াম",
        "طه|ত্ব-হা",
        "الأنبياء|আল-আম্বিয়া",
        "الحج|আল-হাজ্জ",
        "المؤمنون|আল-মুমিনুন",
        "النور|আন-নূর",
        "الفرقان|আল-ফুরকান",
        "الشعراء|আশ-শুআরা",
        "النمل|আন-নামল",
        "القصص|আল-কাসাস",
        "العنكبوت|আল-আনকাবুত",
        "الروم|আর-রূম",
        "لقمان|লুকমান",
        "السجدة|আস-সাজদাহ",
        "الأحزاب|আল-আহযাব",
        "سبأ|সাবা",
        "فاطر|ফাতির",
        "يس|ইয়াসিন",
        "الصافات|আস-সাফফাত",
        "ص|সোয়াদ",
        "الزمر|আয-যুমার",
        "غافر|গাফির",
        "فصلت|ফুসসিলাত",
        "الشورى|আশ-শূরা",
        "الزخرف|আয-যুখরুফ",
        "الدخان|আদ-দুখান",
        "الجاثية|আল-জাসিয়াহ",
        "الأحقاف|আল-আহকাফ",
        "محمد|মুহাম্মদ",
        "الفتح|আল-ফাতহ",
        "الحجرات|আল-হুজুরাত",
        "ق|ক্বাফ",
        "الذاريات|আয-যারিয়াত",
        "الطور|আত-তূর",
        "النجم|আন-নাজম",
        "القمر|আল-কামার",
        "الرحمن|আর-রহমান",
        "الواقعة|আল-ওয়াকিয়া",
        "الحديد|আল-হাদিদ",
        "المجادلة|আল-মুজাদালাহ",
        "الحشر|আল-হাশর",
        "الممتحنة|আল-মুমতাহিনা",
        "الصف|আস-সাফ",
        "الجمعة|আল-জুমুআ",
        "المنافقون|আল-মুনাফিকুন",
        "التغابن|আত-তাগাবুন",
        "الطلاق|আত-তালাক",
        "التحريم|আত-তাহরিম",
        "الملك|আল-মুলক",
        "القلم|আল-কলম",
        "الحاقة|আল-হাক্কাহ",
        "المعارج|আল-মাআরিজ",
        "نوح|নূহ",
        "الجن|আল-জিন",
        "المزمل|আল-মুযযাম্মিল",
        "المدثر|আল-মুদ্দাসসির",
        "القيامة|আল-কিয়ামাহ",
        "الإنسان|আল-ইনসান",
        "المرسلات|আল-মুরসালাত",
        "النبأ|আন-নাবা",
        "النازعات|আন-নাযিআত",
        "عبس|আবাসা",
        "التكوير|আত-তাকভির",
        "الانفطار|আল-ইনফিতার",
        "المطففين|আল-মুতাফফিফিন",
        "الانشقاق|আল-ইনশিকাক",
        "البروج|আল-বুরুজ",
        "الطارق|আত-তারিক",
        "الأعلى|আল-আলা",
        "الغاشية|আল-গাশিয়াহ",
        "الفجر|আল-ফজর",
        "البلد|আল-বালাদ",
        "الشمس|আশ-শামস",
        "الليل|আল-লাইল",
        "الضحى|আদ-দুহা",
        "الشرح|আল-ইনশিরাহ",
        "التين|আত-তিন",
        "العلق|আল-আলাক",
        "القدر|আল-কদর",
        "البينة|আল-বাইয়্যিনাহ",
        "الزلزلة|আয-যিলযাল",
        "العاديات|আল-আদিয়াত",
        "القارعة|আল-কারিআহ",
        "التكاثر|আত-তাকাসুর",
        "العصر|আল-আসর",
        "الهمزة|আল-হুমাযাহ",
        "الفيل|আল-ফিল",
        "قريش|কুরাইশ",
        "الماعون|আল-মাউন",
        "الكوثر|আল-কাওসার",
        "الكافرون|আল-কাফিরুন",
        "النصر|আন-নাসর",
        "المسد|আল-মাসাদ",
        "الإخلاص|আল-ইখলাস",
        "الفلق|আল-ফালাক",
        "الناس|আন-নাস"
    ].map((value, index) => {
        const parts = value.split("|");
        return {
            number: index + 1,
            arabic: parts[0],
            bengali: parts[1]
        };
    });

    /* =====================================================
       STATE
    ===================================================== */

    let dbPromise = null;
    let reciters = [];
    let selectedReciter = null;
    let currentObjectUrl = null;
    let activeDownload = null;
    let currentSurah = null;
    let playbackRequest = 0;
    let playButtons = new Map();

    /* =====================================================
       DATABASE
    ===================================================== */

    function openDB() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("এই ডিভাইসে IndexedDB পাওয়া যায়নি।"));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function () {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "key"
                    });
                }
            };

            request.onsuccess = () => resolve(request.result);

            request.onerror = () => reject(
                request.error || new Error("অডিও ডাটাবেস খোলা যায়নি।")
            );
        }).catch(error => {
            dbPromise = null;
            throw error;
        });

        return dbPromise;
    }

    async function getSaved(key) {
        const db = await openDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const request = tx.objectStore(STORE_NAME).get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveAudio(key, blob, metadata) {
        const db = await openDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");

            tx.objectStore(STORE_NAME).put({
                key,
                blob,
                surahNumber: metadata.surahNumber,
                surahName: metadata.surahName,
                reciterId: metadata.reciterId,
                reciterName: metadata.reciterName,
                savedAt: Date.now()
            });

            tx.oncomplete = () => resolve(true);

            tx.onerror = () => reject(
                tx.error || new Error("অডিও সংরক্ষণ ব্যর্থ।")
            );

            tx.onabort = () => reject(
                tx.error || new Error("অডিও সংরক্ষণ বাতিল।")
            );
        });
    }

    function audioKey(surahNumber, reciter) {
        const target = reciter || selectedReciter;

        if (!target) {
            throw new Error("আগে একজন কারি নির্বাচন করুন।");
        }

        return String(target.id) + "_" + String(surahNumber);
    }

    /* =====================================================
       PLAY BUTTON STATE — FIXED
    ===================================================== */

    function updatePlayButtons() {
        playButtons.forEach((button, number) => {
            const isPlaying = !!(
                currentSurah &&
                currentSurah.number === number &&
                !player.paused &&
                !player.ended
            );

            button.textContent = isPlaying
                ? "⏸️ বন্ধ"
                : "▶️ শুনুন";

            button.setAttribute(
                "aria-label",
                isPlaying ? "অডিও বন্ধ করুন" : "অডিও শুনুন"
            );

            button.setAttribute(
                "aria-pressed",
                isPlaying ? "true" : "false"
            );

            button.classList.toggle("is-playing", isPlaying);
        });
    }

    function updateCurrentPlayButton(isPlaying) {
        if (!currentSurah) return;

        const button = playButtons.get(currentSurah.number);
        if (!button) return;

        button.textContent = isPlaying
            ? "⏸️ বন্ধ"
            : "▶️ শুনুন";

        button.setAttribute(
            "aria-label",
            isPlaying ? "অডিও বন্ধ করুন" : "অডিও শুনুন"
        );

        button.setAttribute(
            "aria-pressed",
            isPlaying ? "true" : "false"
        );

        button.classList.toggle("is-playing", isPlaying);
    }

    /* =====================================================
       AUDIO PLAYER HELPERS
    ===================================================== */

    function releaseObjectUrl() {
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
    }

    function stopAudio(showMessage) {
        playbackRequest++;

        player.pause();

        try {
            player.currentTime = 0;
        } catch (error) {
            // অডিও লোড না থাকলে currentTime সেট করা নাও যেতে পারে।
        }

        player.removeAttribute("src");
        player.load();

        releaseObjectUrl();
        currentSurah = null;

        updatePlayButtons();

        if (showMessage) {
            playerBox.hidden = false;
            nowPlaying.textContent = "অডিও বন্ধ করা হয়েছে";
        } else if (!selectedReciter) {
            nowPlaying.textContent = "কারি নির্বাচন করুন";
        }
    }

    /* =====================================================
       API
    ===================================================== */

    async function fetchJSON(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("API ত্রুটি: HTTP " + response.status);
        }

        return response.json();
    }

    function normalizeName(name) {
        return String(name || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    function matchReciter(name) {
        const n = normalizeName(name);

        if (n.includes("alafasy") || n.includes("afasy")) return 0;
        if (n.includes("sudais")) return 1;
        if (n.includes("shuraim")) return 2;

        if (n.includes("abdulbasit") || n.includes("abdulbaset")) {
            return 3;
        }

        if (n.includes("husary") || n.includes("husari")) return 4;

        return -1;
    }

    const preferredNames = [
        "মিশারি রাশিদ আল-আফাসি",
        "আবদুর রহমান আস-সুদাইস",
        "সাউদ আশ-শুরাইম",
        "আবদুল বাসিত আবদুস সামাদ",
        "মাহমুদ খলিল আল-হুসারি"
    ];

    async function loadReciters() {
        reciterSelect.innerHTML =
            '<option value="">কারি নির্বাচন করুন</option>';

        try {
            const data = await fetchJSON(
                API + "/reciters?language=eng"
            );

            const source = data.reciters || [];
            const matched = new Map();

            source.forEach(reciter => {
                const index = matchReciter(reciter.name);

                if (index < 0 || matched.has(index)) return;

                const mushafs = reciter.moshaf || [];

                const mushaf = mushafs.find(m => {
                    const numbers = String(m.surah_list || "")
                        .split(",")
                        .map(Number)
                        .filter(Number.isFinite);

                    return (
                        Number(m.surah_total) >= 114 &&
                        !!m.server &&
                        numbers.length >= 114
                    );
                });

                if (!mushaf) return;

                matched.set(index, {
                    id: String(reciter.id) + "_" + String(mushaf.id),
                    name: reciter.name,
                    displayName: preferredNames[index],
                    server: mushaf.server,
                    surahList: String(mushaf.surah_list)
                        .split(",")
                        .map(Number)
                        .filter(Number.isFinite),
                    originalId: reciter.id,
                    mushafId: mushaf.id
                });
            });

            reciters = Array.from(matched.values());

            reciterSelect.innerHTML =
                '<option value="">কারি নির্বাচন করুন</option>';

            reciters.forEach(reciter => {
                const option = document.createElement("option");
                option.value = reciter.id;
                option.textContent = reciter.displayName;
                reciterSelect.appendChild(option);
            });

            if (!reciters.length) {
                throw new Error(
                    "পছন্দের কারিদের সম্পূর্ণ সূরার অডিও পাওয়া যায়নি।"
                );
            }

            list.innerHTML =
                "<p>কারি নির্বাচন করে সূরার অডিও শুনুন বা ডাউনলোড করুন।</p>";

            summary.textContent =
                reciters.length + " জন কারির অডিও পাওয়া গেছে।";

        } catch (error) {
            console.error("কারির তালিকা:", error);

            list.innerHTML =
                "<p>কারির তালিকা লোড করা যায়নি। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।</p>";

            summary.textContent = "কারির তালিকা পাওয়া যায়নি।";
        }
    }

    /* =====================================================
       PLAY / STOP BY SURAH BUTTON — FIXED
    ===================================================== */

    async function playSurah(surah) {
        if (!selectedReciter) {
            summary.textContent = "আগে একজন কারি নির্বাচন করুন।";
            return;
        }

        // একই সূরা চললে দ্বিতীয় চাপেই বন্ধ হবে।
        if (
            currentSurah &&
            currentSurah.number === surah.number &&
            !player.paused &&
            !player.ended
        ) {
            stopAudio(true);
            return;
        }

        // একই সূরা পজ করা থাকলে আবার চালু হবে।
        if (
            currentSurah &&
            currentSurah.number === surah.number &&
            player.paused &&
            player.getAttribute("src")
        ) {
            try {
                await player.play();
                playerBox.hidden = false;
                updatePlayButtons();
                return;
            } catch (error) {
                console.warn("পজ করা অডিও চালু করা যায়নি:", error);
            }
        }

        const requestId = ++playbackRequest;
        const reciterAtStart = selectedReciter;

        player.pause();
        player.removeAttribute("src");
        player.load();
        releaseObjectUrl();

        currentSurah = surah;
        playerBox.hidden = false;

        nowPlaying.textContent =
            surah.bengali + " — অডিও লোড হচ্ছে...";

        updatePlayButtons();

        try {
            let saved = null;

            try {
                saved = await getSaved(
                    audioKey(surah.number, reciterAtStart)
                );
            } catch (dbError) {
                console.warn(
                    "অফলাইন ডাটাবেস পড়া যায়নি; অনলাইন অডিও চেষ্টা করা হবে।",
                    dbError
                );
            }

            if (
                requestId !== playbackRequest ||
                currentSurah !== surah ||
                selectedReciter !== reciterAtStart
            ) {
                return;
            }

            if (saved && saved.blob) {
                currentObjectUrl = URL.createObjectURL(saved.blob);
                player.src = currentObjectUrl;
            } else {
                player.src =
                    reciterAtStart.server.replace(/\/?$/, "/") +
                    String(surah.number).padStart(3, "0") +
                    ".mp3";
            }

            player.load();

            nowPlaying.textContent =
                surah.bengali + " — " + reciterAtStart.displayName;

            try {
                await player.play();

                if (requestId !== playbackRequest) return;

                updateCurrentPlayButton(true);
            } catch (error) {
                if (requestId !== playbackRequest) return;

                console.warn("অডিও স্বয়ংক্রিয়ভাবে চালু হয়নি:", error);

                nowPlaying.textContent =
                    surah.bengali +
                    " — চালাতে প্লেয়ারের ▶ বাটনে চাপ দিন।";

                updatePlayButtons();
            }

        } catch (error) {
            if (requestId !== playbackRequest) return;

            console.error("অডিও চালাতে সমস্যা:", error);

            nowPlaying.textContent =
                surah.bengali +
                " — অডিও চালানো যায়নি। ইন্টারনেট পরীক্ষা করুন।";

            updatePlayButtons();
        }
    }

    /* =====================================================
       DOWNLOAD ONE SURAH
    ===================================================== */

    async function downloadSurah(surah, signal, reciter) {
        if (signal && signal.aborted) {
            throw new DOMException("ডাউনলোড বাতিল", "AbortError");
        }

        const targetReciter = reciter || selectedReciter;

        if (!targetReciter) {
            throw new Error("কারি নির্বাচন করা হয়নি।");
        }

        const key = audioKey(surah.number, targetReciter);
        const existing = await getSaved(key);

        if (existing && existing.blob) return "already";

        if (signal && signal.aborted) {
            throw new DOMException("ডাউনলোড বাতিল", "AbortError");
        }

        const url =
            targetReciter.server.replace(/\/?$/, "/") +
            String(surah.number).padStart(3, "0") +
            ".mp3";

        const response = await fetch(url, { signal });

        if (!response.ok) {
            throw new Error("ডাউনলোড ব্যর্থ: HTTP " + response.status);
        }

        const blob = await response.blob();

        if (!blob.size) {
            throw new Error("খালি অডিও ফাইল পাওয়া গেছে।");
        }

        if (signal && signal.aborted) {
            throw new DOMException("ডাউনলোড বাতিল", "AbortError");
        }

        await saveAudio(key, blob, {
            surahNumber: surah.number,
            surahName: surah.bengali,
            reciterId: targetReciter.id,
            reciterName: targetReciter.displayName
        });

        return "saved";
    }

    /* =====================================================
       PROGRESS UI
    ===================================================== */

    function setProgress(visible, message, value) {
        progressBox.hidden = !visible;
        statusText.textContent = message;
        progressBar.value = value;
    }

    /* =====================================================
       DOWNLOAD ONE
    ===================================================== */

    async function downloadOne(surah) {
        if (!selectedReciter) {
            summary.textContent = "আগে একজন কারি নির্বাচন করুন।";
            return;
        }

        if (activeDownload) {
            summary.textContent =
                "অন্য একটি ডাউনলোড চলছে। আগে সেটি শেষ বা বাতিল করুন।";
            return;
        }

        const controller = new AbortController();
        activeDownload = controller;
        const reciterAtStart = selectedReciter;

        try {
            setProgress(true, "ডাউনলোড হচ্ছে: " + surah.bengali, 0);

            const result = await downloadSurah(
                surah,
                controller.signal,
                reciterAtStart
            );

            summary.textContent = result === "already"
                ? surah.bengali + " আগে থেকেই অফলাইনে আছে।"
                : surah.bengali + " ডাউনলোড সম্পন্ন।";

        } catch (error) {
            summary.textContent = error.name === "AbortError"
                ? "ডাউনলোড বাতিল হয়েছে।"
                : "ডাউনলোড ব্যর্থ। ইন্টারনেট বা স্টোরেজ পরীক্ষা করুন।";

            if (error.name !== "AbortError") console.error(error);

        } finally {
            if (activeDownload === controller) activeDownload = null;

            setProgress(false, "", 0);
            await renderList();
        }
    }

    /* =====================================================
       DOWNLOAD ALL SURAHS
    ===================================================== */

    async function downloadAll() {
        if (!selectedReciter) {
            summary.textContent = "আগে একজন কারি নির্বাচন করুন।";
            return;
        }

        if (activeDownload) return;

        const controller = new AbortController();
        activeDownload = controller;
        const reciterAtStart = selectedReciter;

        const availableSurahs = surahs.filter(s =>
            reciterAtStart.surahList.includes(s.number)
        );

        if (!availableSurahs.length) {
            activeDownload = null;
            summary.textContent = "এই কারির সূরার তালিকা পাওয়া যায়নি।";
            return;
        }

        let completed = 0;
        let failed = 0;
        let skipped = 0;

        downloadAllBtn.disabled = true;
        cancelBtn.disabled = false;

        setProgress(true, "ডাউনলোড প্রস্তুত হচ্ছে...", 0);

        try {
            for (let i = 0; i < availableSurahs.length; i++) {
                if (controller.signal.aborted) break;

                const surah = availableSurahs[i];

                statusText.textContent =
                    "ডাউনলোড: " + surah.bengali +
                    " (" + (i + 1) + "/" + availableSurahs.length + ")";

                progressBar.value = Math.round(
                    (i / availableSurahs.length) * 100
                );

                try {
                    const result = await downloadSurah(
                        surah,
                        controller.signal,
                        reciterAtStart
                    );

                    if (result === "already") skipped++;
                    else completed++;

                } catch (error) {
                    if (error.name === "AbortError") throw error;

                    console.error(
                        "Surah download failed:",
                        surah.number,
                        error
                    );

                    failed++;
                }

                progressBar.value = Math.round(
                    ((i + 1) / availableSurahs.length) * 100
                );
            }

            summary.textContent =
                "নতুন ডাউনলোড: " + completed +
                " | আগে ছিল: " + skipped +
                " | ব্যর্থ: " + failed +
                (controller.signal.aborted
                    ? " | ডাউনলোড বাতিল হয়েছে"
                    : " | ডাউনলোড শেষ");

        } catch (error) {
            if (error.name !== "AbortError") {
                console.error(error);
                summary.textContent = "ডাউনলোডে সমস্যা হয়েছে।";
            }
        } finally {
            if (activeDownload === controller) activeDownload = null;

            downloadAllBtn.disabled = false;
            cancelBtn.disabled = true;

            setProgress(false, "", 0);
            await renderList();
        }
    }

    /* =====================================================
       RENDER SURAH LIST
    ===================================================== */

    async function renderList() {
        if (!selectedReciter) {
            playButtons.clear();
            list.innerHTML = "<p>আগে একজন কারি নির্বাচন করুন।</p>";
            return;
        }

        const reciterAtStart = selectedReciter;
        const query = (searchInput.value || "").trim().toLowerCase();

        const visibleSurahs = surahs.filter(s =>
            s.bengali.toLowerCase().includes(query) ||
            s.arabic.includes(query) ||
            String(s.number).includes(query)
        );

        if (!visibleSurahs.length) {
            playButtons.clear();
            list.innerHTML = "<p>কোনো সূরা পাওয়া যায়নি।</p>";
            return;
        }

        list.innerHTML = "<p>সূরার তালিকা লোড হচ্ছে...</p>";

        const fragment = document.createDocumentFragment();
        const newPlayButtons = new Map();
        let savedCount = 0;

        try {
            for (const surah of visibleSurahs) {
                const saved = await getSaved(
                    audioKey(surah.number, reciterAtStart)
                );

                if (selectedReciter !== reciterAtStart) return;

                const hasSavedAudio = !!(saved && saved.blob);

                if (hasSavedAudio) savedCount++;

                const card = document.createElement("div");
                card.className = "surah-audio-item";

                const info = document.createElement("div");
                info.className = "surah-audio-info";

                const title = document.createElement("strong");
                title.textContent =
                    surah.number + ". " + surah.bengali;

                const arabic = document.createElement("span");
                arabic.textContent = surah.arabic;
                arabic.dir = "rtl";

                const state = document.createElement("small");
                state.textContent = hasSavedAudio
                    ? "✓ অফলাইনে সংরক্ষিত"
                    : "অনলাইন অডিও";

                info.append(title, arabic, state);

                const actions = document.createElement("div");
                actions.className = "surah-audio-actions";

                const playBtn = document.createElement("button");
                playBtn.type = "button";
                playBtn.className = "surah-audio-play-btn";
                playBtn.textContent = "▶️ শুনুন";
                playBtn.setAttribute("aria-pressed", "false");

                playBtn.addEventListener("click", function () {
                    // দ্রুত UI আপডেট; আসল অবস্থা player events-ও আপডেট করবে।
                    if (
                        currentSurah &&
                        currentSurah.number === surah.number &&
                        !player.paused
                    ) {
                        stopAudio(true);
                    } else {
                        playSurah(surah);
                    }
                });

                newPlayButtons.set(surah.number, playBtn);

                const downloadBtn = document.createElement("button");
                downloadBtn.type = "button";
                downloadBtn.textContent = hasSavedAudio
                    ? "✓ ডাউনলোড হয়েছে"
                    : "⬇ ডাউনলোড";

                downloadBtn.disabled = hasSavedAudio;

                downloadBtn.addEventListener("click", function () {
                    downloadOne(surah);
                });

                actions.append(playBtn, downloadBtn);
                card.append(info, actions);
                fragment.appendChild(card);
            }

            if (selectedReciter !== reciterAtStart) return;

            list.replaceChildren(fragment);
            playButtons = newPlayButtons;

            // তালিকা পুনরায় তৈরি হলেও চলমান সূরার বাটন সঠিক থাকবে।
            updatePlayButtons();

            summary.textContent =
                "এই কারির " + savedCount +
                "টি সূরা অফলাইনে সংরক্ষিত আছে।";

        } catch (error) {
            console.error("সূরার তালিকা:", error);
            list.innerHTML =
                "<p>সূরার তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।</p>";
        }
    }

    /* =====================================================
       PLAYER EVENTS — BUTTON STATE SYNC
    ===================================================== */

    player.addEventListener("play", function () {
        updatePlayButtons();
        updateCurrentPlayButton(true);
    });

    player.addEventListener("playing", function () {
        updatePlayButtons();
        updateCurrentPlayButton(true);
    });

    player.addEventListener("pause", function () {
        updatePlayButtons();
    });

    player.addEventListener("ended", function () {
        currentSurah = null;
        releaseObjectUrl();
        updatePlayButtons();

        nowPlaying.textContent =
            "অডিও শেষ হয়েছে। আবার শুনতে ▶️ শুনুন চাপুন।";
    });

    player.addEventListener("error", function () {
        if (!currentSurah) return;

        updatePlayButtons();

        nowPlaying.textContent =
            currentSurah.bengali +
            " — অডিও চালানো যায়নি। ইন্টারনেট বা অডিও লিংক পরীক্ষা করুন।";
    });

    /* =====================================================
       EVENTS
    ===================================================== */

    reciterSelect.addEventListener("change", async function () {
        const id = reciterSelect.value;

        stopAudio(false);

        selectedReciter = reciters.find(r => r.id === id) || null;

        nowPlaying.textContent = selectedReciter
            ? "কারি নির্বাচিত: " + selectedReciter.displayName
            : "কারি নির্বাচন করুন";

        if (activeDownload) activeDownload.abort();

        await renderList();
    });

    searchInput.addEventListener("input", function () {
        renderList();
    });

    downloadAllBtn.addEventListener("click", function () {
        downloadAll();
    });

    cancelBtn.addEventListener("click", function () {
        if (activeDownload) {
            activeDownload.abort();
            statusText.textContent = "ডাউনলোড বাতিল হচ্ছে...";
        }
    });

    if (stopBtn) {
        stopBtn.addEventListener("click", function () {
            stopAudio(true);
        });
    }

    window.addEventListener("beforeunload", releaseObjectUrl);

    /* =====================================================
       INITIALIZE
    ===================================================== */

    cancelBtn.disabled = true;
    playerBox.hidden = true;

    loadReciters();

})();
