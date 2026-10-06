/* =========================================================
   QURAN SHARIF
   Local Quran Database
   Arabic + Bengali
========================================================= */


/* =========================================================
   ১১৪টি সূরার বাংলা নাম
========================================================= */

const bengaliSurahNames = [

    "আল-ফাতিহা",
    "আল-বাকারা",
    "আলে ইমরান",
    "আন-নিসা",
    "আল-মায়িদা",
    "আল-আনআম",
    "আল-আরাফ",
    "আল-আনফাল",
    "আত-তাওবা",
    "ইউনুস",
    "হুদ",
    "ইউসুফ",
    "আর-রাদ",
    "ইবরাহিম",
    "আল-হিজর",
    "আন-নাহল",
    "আল-ইসরা",
    "আল-কাহফ",
    "মারইয়াম",
    "ত্বা-হা",
    "আল-আম্বিয়া",
    "আল-হাজ্জ",
    "আল-মুমিনুন",
    "আন-নূর",
    "আল-ফুরকান",
    "আশ-শুআরা",
    "আন-নামল",
    "আল-কাসাস",
    "আল-আনকাবুত",
    "আর-রূম",
    "লুকমান",
    "আস-সাজদাহ",
    "আল-আহযাব",
    "সাবা",
    "ফাতির",
    "ইয়াসিন",
    "আস-সাফফাত",
    "সাদ",
    "আয-যুমার",
    "গাফির",
    "ফুসসিলাত",
    "আশ-শূরা",
    "আয-যুখরুফ",
    "আদ-দুখান",
    "আল-জাসিয়া",
    "আল-আহকাফ",
    "মুহাম্মাদ",
    "আল-ফাতহ",
    "আল-হুজুরাত",
    "কাফ",
    "আয-যারিয়াত",
    "আত-তূর",
    "আন-নাজম",
    "আল-কামার",
    "আর-রহমান",
    "আল-ওয়াকিয়া",
    "আল-হাদিদ",
    "আল-মুজাদালাহ",
    "আল-হাশর",
    "আল-মুমতাহিনা",
    "আস-সফ",
    "আল-জুমুআ",
    "আল-মুনাফিকুন",
    "আত-তাগাবুন",
    "আত-তালাক",
    "আত-তাহরিম",
    "আল-মুলক",
    "আল-কলম",
    "আল-হাক্কাহ",
    "আল-মাআরিজ",
    "নূহ",
    "আল-জিন",
    "আল-মুযযাম্মিল",
    "আল-মুদ্দাসসির",
    "আল-কিয়ামাহ",
    "আল-ইনসান",
    "আল-মুরসালাত",
    "আন-নাবা",
    "আন-নাযিআত",
    "আবাসা",
    "আত-তাকভীর",
    "আল-ইনফিতার",
    "আল-মুতাফফিফিন",
    "আল-ইনশিকাক",
    "আল-বুরুজ",
    "আত-তারিক",
    "আল-আলা",
    "আল-গাশিয়াহ",
    "আল-ফজর",
    "আল-বালাদ",
    "আশ-শামস",
    "আল-লাইল",
    "আদ-দুহা",
    "আশ-শারহ",
    "আত-তিন",
    "আল-আলাক",
    "আল-কদর",
    "আল-বাইয়্যিনাহ",
    "আয-যিলযাল",
    "আল-আদিয়াত",
    "আল-কারিআহ",
    "আত-তাকাসুর",
    "আল-আসর",
    "আল-হুমাযাহ",
    "আল-ফীল",
    "কুরাইশ",
    "আল-মাউন",
    "আল-কাওসার",
    "আল-কাফিরুন",
    "আন-নাসর",
    "আল-মাসাদ",
    "আল-ইখলাস",
    "আল-ফালাক",
    "আন-নাস"

];


/* =========================================================
   Quran Database
========================================================= */

let quranData = {};

let quranLoaded = false;

let quranLoading = false;


/* =========================================================
   Bismillah
========================================================= */

const BISMILLAH =
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";


/* =========================================================
   ১১৪টি JSON Load
========================================================= */

async function loadAllQuranData() {

    if (quranLoaded) {
        return quranData;
    }


    if (quranLoading) {

        while (quranLoading) {

            await new Promise(
                function(resolve) {
                    setTimeout(resolve, 50);
                }
            );

        }

        return quranData;

    }


    quranLoading = true;


    console.log(
        "📖 ১১৪টি সূরা লোড হচ্ছে..."
    );


    try {

        const requests = [];


        for (
            let i = 1;
            i <= 114;
            i++
        ) {

            const fileNumber =
                String(i).padStart(3, "0");


            requests.push(

                fetch(
                    `data/quran/${fileNumber}.json`
                )

                .then(
                    function(response) {

                        if (!response.ok) {

                            throw new Error(
                                `সূরা ${i} ফাইল পাওয়া যায়নি`
                            );

                        }

                        return response.json();

                    }
                )

                .then(
                    function(data) {

                        quranData[i] = data;

                    }
                )

            );

        }


        await Promise.all(requests);


        quranLoaded = true;


        console.log(
            "✅ ১১৪টি সূরা সফলভাবে লোড হয়েছে"
        );


        return quranData;


    } catch (error) {

        console.error(
            "❌ Quran database load error:",
            error
        );


        alert(
            "কুরআনের ডাটা লোড করা যায়নি।\n\n" +
            "data/quran/001.json থেকে 114.json পর্যন্ত ফাইলগুলো পরীক্ষা করুন।"
        );


        throw error;


    } finally {

        quranLoading = false;

    }

}


/* =========================================================
   সূরা Dropdown + ১১৪ সূরার List
========================================================= */

function loadSurahs() {

    const surahSelect =
        document.getElementById("surahSelect");


    const ayahSelect =
        document.getElementById("ayahSelect");


    const quranReader =
        document.getElementById("quranReader");


    if (
        !surahSelect ||
        !ayahSelect ||
        !quranReader
    ) {

        console.error(
            "❌ Quran UI পাওয়া যায়নি"
        );

        return;

    }


    /* =====================================================
       Dropdown
    ===================================================== */

    surahSelect.innerHTML =
        `<option value="">সূরা নির্বাচন</option>`;


    for (
        let i = 1;
        i <= 114;
        i++
    ) {

        const option =
            document.createElement("option");


        option.value = i;


        option.textContent =
            `${i}. ${
                bengaliSurahNames[i - 1]
                || "সূরা " + i
            }`;


        surahSelect.appendChild(option);

    }


    /* =====================================================
       আয়াত Dropdown
    ===================================================== */

    ayahSelect.innerHTML =
        `<option value="">আয়াত নির্বাচন</option>`;


    ayahSelect.disabled = true;


    surahSelect.onchange =
        function() {

            const surahNumber =
                parseInt(
                    this.value,
                    10
                );


            ayahSelect.innerHTML =
                `<option value="">আয়াত নির্বাচন</option>`;


            if (!surahNumber) {

                ayahSelect.disabled = true;

                return;

            }


            const surah =
                quranData[surahNumber];


            if (
                !surah ||
                !Array.isArray(surah.ayahs)
            ) {

                console.log(
                    `⏳ সূরা ${surahNumber} এখনো লোড হয়নি`
                );


                ayahSelect.disabled = true;

                return;

            }


            ayahSelect.disabled = false;


            surah.ayahs.forEach(
                function(ayah) {

                    const option =
                        document.createElement("option");


                    option.value =
                        ayah.number;


                    option.textContent =
                        `আয়াত ${ayah.number}`;


                    ayahSelect.appendChild(option);

                }
            );

        };


    /* =====================================================
       নিচে ১১৪টি সূরার List
    ===================================================== */

    let html = `

        <div class="surah-list">

            <div class="surah-list-title">
                ১১৪টি সূরা
            </div>

            <div class="surah-list-grid">

    `;


    for (
        let i = 1;
        i <= 114;
        i++
    ) {

        const name =
            bengaliSurahNames[i - 1]
            ||
            `সূরা ${i}`;


        let ayahCount = "আয়াত";


        if (
            quranData[i] &&
            Array.isArray(quranData[i].ayahs)
        ) {

            ayahCount =
                `${quranData[i].ayahs.length} আয়াত`;

        }


        html += `

            <div
                class="surah-list-item"
                data-surah="${i}"
            >

                <div class="surah-list-number">
                    ${i}
                </div>

                <div class="surah-list-info">

                    <div class="surah-list-name">
                        ${escapeHtml(name)}
                    </div>

                    <div class="surah-list-meta">
                        ${ayahCount}
                    </div>

                </div>

                <div class="surah-list-arrow">
                    ›
                </div>

            </div>

        `;

    }


    html += `

            </div>

        </div>

    `;


    quranReader.innerHTML = html;


    /* =====================================================
       নিচের সূরায় Click
    ===================================================== */

    quranReader
        .querySelectorAll(".surah-list-item")
        .forEach(
            function(item) {

                item.addEventListener(
                    "click",
                    async function() {

                        const surahNumber =
                            Number(
                                this.dataset.surah
                            );


                        if (!surahNumber) {
                            return;
                        }


                        console.log(
                            `📖 সূরা ${surahNumber} নির্বাচন করা হয়েছে`
                        );


                        try {

                            if (
                                !quranData[surahNumber]
                            ) {

                                await loadAllQuranData();

                            }


                            surahSelect.value =
                                surahNumber;


                            surahSelect.dispatchEvent(
                                new Event("change")
                            );


                            ayahSelect.value = "1";


                            loadSurah(
                                surahNumber,
                                1
                            );

                        } catch (error) {

                            console.error(
                                "❌ সূরা খোলা যায়নি:",
                                error
                            );


                            alert(
                                "এই সূরাটি এখন খোলা যাচ্ছে না। আবার চেষ্টা করুন।"
                            );

                        }

                    }
                );

            }
        );


    console.log(
        "✅ ১১৪টি সূরা List তৈরি হয়েছে"
    );

}


/* =========================================================
   GO Button
========================================================= */

function setupQuranGoButton() {

    const goButton =
        document.getElementById("goAyahBtn");


    if (!goButton) {

        console.error(
            "❌ goAyahBtn পাওয়া যায়নি"
        );

        return;

    }


    goButton.onclick =
        function() {

            const surahSelect =
                document.getElementById("surahSelect");


            const ayahSelect =
                document.getElementById("ayahSelect");


            if (
                !surahSelect ||
                !ayahSelect
            ) {

                return;

            }


            const surahNumber =
                parseInt(
                    surahSelect.value,
                    10
                );


            const ayahNumber =
                parseInt(
                    ayahSelect.value,
                    10
                );


            if (!surahNumber) {

                alert(
                    "আগে একটি সূরা নির্বাচন করুন।"
                );

                return;

            }


            if (!ayahNumber) {

                alert(
                    "আগে একটি আয়াত নির্বাচন করুন।"
                );

                return;

            }


            loadSurah(
                surahNumber,
                ayahNumber
            );

        };


    console.log(
        "✓ GO Button প্রস্তুত"
    );

}


/* =========================================================
   সূরা Load
========================================================= */

function loadSurah(
    surahNumber,
    selectedAyah = 1
) {

    const quranReader =
        document.getElementById("quranReader");


    if (!quranReader) {

        console.error(
            "❌ quranReader পাওয়া যায়নি"
        );

        return;

    }


    const surah =
        quranData[surahNumber];


    if (
        !surah ||
        !Array.isArray(surah.ayahs)
    ) {

        quranReader.innerHTML = `

            <div class="quran-error">
                এই সূরার ডাটা পাওয়া যায়নি।
            </div>

        `;

        return;

    }


    /* =========================
       SAVE LAST READ
    ========================= */

    localStorage.setItem(
        "quranLastRead",
        JSON.stringify({
            surah: surahNumber,
            ayah: selectedAyah
        })
    );


    renderSurah(
        surah,
        selectedAyah
    );

}


/* =========================================================
   Bismillah Remove
========================================================= */

function removeBismillah(
    text,
    surahNumber,
    ayahNumber
) {

    if (ayahNumber !== 1) {
        return text;
    }


    if (
        surahNumber === 1 ||
        surahNumber === 9
    ) {

        return text;

    }


    if (!text) {
        return text;
    }


    const normalizedText =
        text.trim();


    const normalizedBismillah =
        BISMILLAH.trim();


    if (
        normalizedText.startsWith(
            normalizedBismillah
        )
    ) {

        return normalizedText
            .substring(
                normalizedBismillah.length
            )
            .trim();

    }


    return text;

}


/* =========================================================
   সূরা Render
========================================================= */

function renderSurah(
    surah,
    selectedAyah
) {

    const quranReader =
        document.getElementById("quranReader");


    if (!quranReader) {
        return;
    }


    const surahNumber =
        Number(surah.number);


    const surahName =
        bengaliSurahNames[surahNumber - 1]
        ||
        `সূরা ${surahNumber}`;


    let html = "";


    /* =====================================================
       Header
    ===================================================== */

    html += `

        <div class="surah-heading">

            <div class="surah-number">
                সূরা ${surahNumber}
            </div>

            <h1>
                ${escapeHtml(surahName)}
            </h1>

            <div class="surah-info">
                ${surah.ayahs.length} আয়াত
            </div>

        </div>

    `;


    /* =====================================================
       Bismillah
    ===================================================== */

    if (
        surahNumber !== 1 &&
        surahNumber !== 9
    ) {

        html += `

            <div class="bismillah-box">

                <div class="bismillah">
                    ${BISMILLAH}
                </div>

            </div>

        `;

    }


    /* =====================================================
       আয়াত
    ===================================================== */

    surah.ayahs.forEach(
        function(ayah) {

            const ayahNumber =
                Number(ayah.number);


            const selected =
                Number(selectedAyah) ===
                ayahNumber;


            const arabicText =
                removeBismillah(
                    ayah.arabic,
                    surahNumber,
                    ayahNumber
                );


            /* ==============================
               Bookmark Status
            ============================== */

            const bookmarked =
                isAyahBookmarked(
                    surahNumber,
                    ayahNumber
                );


            html += `

                <article
                    class="ayah ${
                        selected
                            ? "highlight"
                            : ""
                    }"
                    id="ayah-${ayahNumber}"
                    data-surah="${surahNumber}"
                    data-ayah="${ayahNumber}"
                >

                    <div class="ayah-number">
                        আয়াত ${ayahNumber}
                    </div>


                    <div
                        class="arabic"
                        dir="rtl"
                    >
                        ${escapeHtml(arabicText)}
                    </div>


                    <div class="translation">
                        ${escapeHtml(ayah.bengali)}
                    </div>


                    <div class="ayah-actions">

                        <button
                            type="button"
                            class="ayah-action ayah-word-btn"
                            data-surah="${surahNumber}"
                            data-ayah="${ayahNumber}"
                        >
                            শব্দ
                        </button>


                        <button
                            type="button"
                            class="ayah-action ayah-audio-btn"
                            data-surah="${surahNumber}"
                            data-ayah="${ayahNumber}"
                        >
                            🔊
                        </button>


                        <button
                            type="button"
                            class="ayah-action ayah-bookmark-btn ${
                                bookmarked
                                    ? "bookmarked"
                                    : ""
                            }"
                            data-surah="${surahNumber}"
                            data-ayah="${ayahNumber}"
                            aria-label="${
                                bookmarked
                                    ? "বুকমার্ক থেকে সরান"
                                    : "বুকমার্ক করুন"
                            }"
                        >
                            ${
                                bookmarked
                                    ? "🔖✓"
                                    : "🔖"
                            }
                        </button>


                        <button
                            type="button"
                            class="ayah-action ayah-tafsir-btn"
                            data-surah="${surahNumber}"
                            data-ayah="${ayahNumber}"
                        >
                            📖 তাফসির
                        </button>

                    </div>

                </article>

            `;

        }
    );


    quranReader.innerHTML =
        html;


    setupAyahEvents();


    /* =====================================================
       Selected Ayah Scroll
    ===================================================== */

    if (selectedAyah) {

        setTimeout(
            function() {

                const selectedElement =
                    document.getElementById(
                        `ayah-${selectedAyah}`
                    );


                if (selectedElement) {

                    selectedElement.scrollIntoView({

                        behavior: "smooth",

                        block: "center"

                    });

                }

            },
            200
        );

    }

}


/* =========================================================
   Ayah Events
========================================================= */

function setupAyahEvents() {

    const quranReader =
        document.getElementById("quranReader");


    if (!quranReader) {
        return;
    }


    /* =====================================================
       Ayah Click → Word-by-Word
    ===================================================== */

    quranReader
        .querySelectorAll(".ayah")
        .forEach(
            function(card) {

                card.addEventListener(
                    "click",
                    function(event) {

                        if (
                            event.target.closest("button")
                        ) {
                            return;
                        }


                        const surahNumber =
                            Number(card.dataset.surah);


                        const ayahNumber =
                            Number(card.dataset.ayah);


                        const arabicElement =
                            card.querySelector(".arabic");


                        const arabicText =
                            arabicElement
                                ? arabicElement.textContent
                                : "";


                        openWordMeaning(
                            surahNumber,
                            ayahNumber,
                            arabicText
                        );

                    }
                );

            }
        );


    /* =====================================================
       Word Button
    ===================================================== */

    quranReader
        .querySelectorAll(".ayah-word-btn")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        const surahNumber =
                            Number(button.dataset.surah);


                        const ayahNumber =
                            Number(button.dataset.ayah);


                        const card =
                            button.closest(".ayah");


                        const arabicElement =
                            card
                                ? card.querySelector(".arabic")
                                : null;


                        const arabicText =
                            arabicElement
                                ? arabicElement.textContent
                                : "";


                        openWordMeaning(
                            surahNumber,
                            ayahNumber,
                            arabicText
                        );

                    }
                );

            }
        );


    /* =====================================================
       Audio Button
    ===================================================== */

    quranReader
        .querySelectorAll(".ayah-audio-btn")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        const surahNumber =
                            Number(button.dataset.surah);


                        const ayahNumber =
                            Number(button.dataset.ayah);


                        playAyah(
                            surahNumber,
                            ayahNumber,
                            button
                        );

                    }
                );

            }
        );


    /* =====================================================
       Bookmark Button
    ===================================================== */

    quranReader
        .querySelectorAll(".ayah-bookmark-btn")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        bookmarkAyah(
                            Number(button.dataset.surah),
                            Number(button.dataset.ayah),
                            button
                        );

                    }
                );

            }
        );


    /* =====================================================
       Tafsir Button
    ===================================================== */

    quranReader
        .querySelectorAll(".ayah-tafsir-btn")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        const surahNumber =
                            Number(button.dataset.surah);


                        const ayahNumber =
                            Number(button.dataset.ayah);


                        if (
                            typeof openTafsir ===
                            "function"
                        ) {

                            openTafsir(
                                surahNumber,
                                ayahNumber
                            );

                        } else {

                            console.error(
                                "❌ openTafsir পাওয়া যায়নি"
                            );

                            alert(
                                "তাফসির ফাংশন পাওয়া যায়নি।"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   Word-by-Word
========================================================= */

function openWordMeaning(
    surahNumber,
    ayahNumber,
    arabicText
) {

    if (
        typeof openWordByWord ===
        "function"
    ) {

        openWordByWord(
            surahNumber,
            ayahNumber,
            arabicText
        );

    } else {

        console.error(
            "❌ openWordByWord পাওয়া যায়নি"
        );


        alert(
            "Word-by-Word ফাংশন পাওয়া যায়নি।"
        );

    }

}


/* =========================================================
   AYAH AUDIO
========================================================= */

let currentQuranAudio = null;

let currentAudioButton = null;


/* =========================================================
   Global Ayah Number
========================================================= */

function getGlobalAyahNumber(
    surahNumber,
    ayahNumber
) {

    let globalAyahNumber =
        Number(ayahNumber);


    for (
        let i = 1;
        i < Number(surahNumber);
        i++
    ) {

        if (
            quranData[i] &&
            Array.isArray(quranData[i].ayahs)
        ) {

            globalAyahNumber +=
                quranData[i].ayahs.length;

        }

    }


    return globalAyahNumber;

}


/* =========================================================
   Audio Play / Pause
========================================================= */

function playAyah(
    surahNumber,
    ayahNumber,
    button = null
) {

    const globalAyahNumber =
        getGlobalAyahNumber(
            surahNumber,
            ayahNumber
        );


    const audioUrl =
        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;


    /* =====================================================
       একই আয়াত আবার চাপলে Pause / Play
    ===================================================== */

    if (
        currentQuranAudio &&
        currentAudioButton === button
    ) {

        if (
            currentQuranAudio.paused
        ) {

            currentQuranAudio
                .play()
                .then(
                    function() {

                        if (button) {

                            button.textContent =
                                "⏸️";

                        }

                    }
                )
                .catch(
                    function(error) {

                        console.error(
                            "❌ Audio Play Error:",
                            error
                        );

                    }
                );

        } else {

            currentQuranAudio.pause();


            if (button) {

                button.textContent =
                    "▶️";

            }

        }


        return;

    }


    /* =====================================================
       আগের Audio বন্ধ
    ===================================================== */

    stopQuranAudio();


    /* =====================================================
       নতুন Audio
    ===================================================== */

    const audio =
        new Audio(audioUrl);


    currentQuranAudio =
        audio;


    currentAudioButton =
        button;


    if (button) {

        button.textContent =
            "⏳";

    }


    /* =====================================================
       Audio Play
    ===================================================== */

    audio.play()
        .then(
            function() {

                if (button) {

                    button.textContent =
                        "⏸️";

                }

            }
        )
        .catch(
            function(error) {

                console.error(
                    "❌ Audio চালু হয়নি:",
                    error
                );


                if (button) {

                    button.textContent =
                        "🔊";

                }


                alert(
                    "অডিও চালু করা যাচ্ছে না।\nইন্টারনেট সংযোগ পরীক্ষা করুন।"
                );


                currentQuranAudio =
                    null;


                currentAudioButton =
                    null;

            }
        );


    /* =====================================================
       Audio শেষ
    ===================================================== */

    audio.addEventListener(
        "ended",
        function() {

            if (button) {

                button.textContent =
                    "🔊";

            }


            currentQuranAudio =
                null;


            currentAudioButton =
                null;

        }
    );


    /* =====================================================
       Audio Error
    ===================================================== */

    audio.addEventListener(
        "error",
        function() {

            console.error(
                "❌ Audio Load Error"
            );


            if (button) {

                button.textContent =
                    "🔊";

            }


            currentQuranAudio =
                null;


            currentAudioButton =
                null;

        }
    );

}


/* =========================================================
   Audio Stop
========================================================= */

function stopQuranAudio() {

    if (currentQuranAudio) {

        currentQuranAudio.pause();

        currentQuranAudio.currentTime =
            0;

    }


    if (currentAudioButton) {

        currentAudioButton.textContent =
            "🔊";

    }


    currentQuranAudio =
        null;


    currentAudioButton =
        null;

}


/* =========================================================
   Bookmark Data Read
========================================================= */

function getQuranBookmarks() {

    const storageKey =
        "quranBookmarks";


    try {

        const saved =
            localStorage.getItem(
                storageKey
            );


        if (!saved) {
            return [];
        }


        const bookmarks =
            JSON.parse(saved);


        if (
            !Array.isArray(bookmarks)
        ) {

            return [];

        }


        return bookmarks;

    } catch (error) {

        console.error(
            "❌ Bookmark পড়া যায়নি:",
            error
        );


        return [];

    }

}


/* =========================================================
   Check Bookmark
========================================================= */

function isAyahBookmarked(
    surahNumber,
    ayahNumber
) {

    const bookmarks =
        getQuranBookmarks();


    return bookmarks.some(
        function(item) {

            return (

                Number(item.surah) ===
                Number(surahNumber)

                &&

                Number(item.ayah) ===
                Number(ayahNumber)

            );

        }
    );

}


/* =========================================================
   Bookmark Button UI Update
========================================================= */

function updateBookmarkButton(
    button,
    bookmarked
) {

    if (!button) {
        return;
    }


    if (bookmarked) {

        button.textContent =
            "🔖✓";


        button.classList.add(
            "bookmarked"
        );


        button.setAttribute(
            "aria-label",
            "বুকমার্ক থেকে সরান"
        );

    } else {

        button.textContent =
            "🔖";


        button.classList.remove(
            "bookmarked"
        );


        button.setAttribute(
            "aria-label",
            "বুকমার্ক করুন"
        );

    }

}


/* =========================================================
   Bookmark
========================================================= */

function bookmarkAyah(
    surahNumber,
    ayahNumber,
    button = null
) {

    const storageKey =
        "quranBookmarks";


    let bookmarks =
        getQuranBookmarks();


    const existingIndex =
        bookmarks.findIndex(
            function(item) {

                return (

                    Number(item.surah) ===
                    Number(surahNumber)

                    &&

                    Number(item.ayah) ===
                    Number(ayahNumber)

                );

            }
        );


    if (existingIndex >= 0) {

        bookmarks.splice(
            existingIndex,
            1
        );


        localStorage.setItem(
            storageKey,
            JSON.stringify(bookmarks)
        );


        updateBookmarkButton(
            button,
            false
        );


        alert(
            "বুকমার্ক থেকে সরানো হয়েছে।"
        );

    } else {

        bookmarks.push({

            surah:
                surahNumber,

            ayah:
                ayahNumber,

            surahName:
                bengaliSurahNames[
                    surahNumber - 1
                ]
                ||
                `সূরা ${surahNumber}`

        });


        localStorage.setItem(
            storageKey,
            JSON.stringify(bookmarks)
        );


        updateBookmarkButton(
            button,
            true
        );


        alert(
            "আয়াতটি বুকমার্ক করা হয়েছে।"
        );

    }


    /* =====================================================
       Bookmark Page থাকলে সঙ্গে সঙ্গে Refresh
    ===================================================== */

    if (
        typeof renderBookmarkPage ===
        "function"
    ) {

        renderBookmarkPage();

    }

}


/* =========================================================
   HTML Escape
========================================================= */

function escapeHtml(text) {

    return String(text || "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   Search Highlight
========================================================= */

function highlightSearchText(
    text,
    query
) {

    if (
        !text ||
        !query
    ) {

        return escapeHtml(
            text || ""
        );

    }


    const escapedText =
        escapeHtml(text);


    const escapedQuery =
        escapeHtml(query);


    const safeQuery =
        escapedQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );


    const regex =
        new RegExp(
            "(" + safeQuery + ")",
            "gi"
        );


    return escapedText.replace(
        regex,
        '<mark class="search-highlight">$1</mark>'
    );

}


/* =========================================================
   Quran UI পাওয়া পর্যন্ত অপেক্ষা
========================================================= */

function waitForQuranUI() {

    const surahSelect =
        document.getElementById(
            "surahSelect"
        );


    const ayahSelect =
        document.getElementById(
            "ayahSelect"
        );


    const goButton =
        document.getElementById(
            "goAyahBtn"
        );


    const quranReader =
        document.getElementById(
            "quranReader"
        );


    if (
        !surahSelect ||
        !ayahSelect ||
        !goButton ||
        !quranReader
    ) {

        console.log(
            "⏳ Quran UI এখনো পাওয়া যায়নি..."
        );


        setTimeout(
            waitForQuranUI,
            300
        );


        return;

    }


    console.log(
        "✅ Quran UI পাওয়া গেছে"
    );


    loadSurahs();


    setupQuranGoButton();


    console.log(
        "✅ Quran App UI প্রস্তুত"
    );

}


/* =========================================================
   Quran App Start
========================================================= */

async function startQuranApp() {

    console.log(
        "📖 Quran App শুরু হচ্ছে..."
    );


    waitForQuranUI();


    try {

        await loadAllQuranData();


        console.log(
            "✅ Quran Database Ready"
        );


        loadSurahs();


    } catch (error) {

        console.error(
            "❌ Quran App শুরু হয়নি:",
            error
        );

    }

}


/* =========================================================
   QURAN SEARCH
========================================================= */

function initQuranSearch() {

    const searchBtn =
        document.getElementById(
            "quranSearchBtn"
        );


    const searchInput =
        document.getElementById(
            "quranSearchInput"
        );


    const resultsBox =
        document.getElementById(
            "searchResults"
        );


    if (
        !searchBtn ||
        !searchInput ||
        !resultsBox
    ) {

        console.log(
            "❌ Search UI পাওয়া যায়নি"
        );

        return;

    }


    /* =====================================================
       Search Function
    ===================================================== */

    async function doSearch() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        /* =================================================
           Empty Search
        ================================================= */

        if (!query) {

            resultsBox.innerHTML = `

                <div class="search-empty">
                    🔎 কোনো শব্দ বা বাক্য লিখে সার্চ করুন
                </div>

            `;

            return;

        }


        /* =================================================
           Quran Database নিশ্চিত করা
        ================================================= */

        try {

            await loadAllQuranData();

        } catch (error) {

            console.error(
                error
            );


            resultsBox.innerHTML = `

                <div class="search-empty">
                    ❌ কুরআনের ডাটা লোড করা যায়নি।
                </div>

            `;

            return;

        }


        const results = [];


        /* =================================================
           সব সূরা Search
        ================================================= */

        for (
            let surahNumber = 1;
            surahNumber <= 114;
            surahNumber++
        ) {

            const surah =
                quranData[surahNumber];


            if (
                !surah ||
                !Array.isArray(surah.ayahs)
            ) {

                continue;

            }


            surah.ayahs.forEach(
                function(ayah) {

                    /* ===============================
                       আসল JSON Field
                    =============================== */

                    const arabicText =
                        String(
                            ayah.arabic || ""
                        );


                    const banglaText =
                        String(
                            ayah.bengali || ""
                        );


                    const surahName =
                        String(
                            bengaliSurahNames[
                                surahNumber - 1
                            ] || ""
                        ).toLowerCase();


                    /* ===============================
                       Match
                    =============================== */

                    const arabicMatch =
                        arabicText
                            .toLowerCase()
                            .includes(query);


                    const banglaMatch =
                        banglaText
                            .toLowerCase()
                            .includes(query);


                    const surahNameMatch =
                        surahName.includes(
                            query
                        );


                    const surahNumberMatch =
                        String(
                            surahNumber
                        ) === query;


                    /* ===============================
                       Result
                    =============================== */

                    if (
                        arabicMatch ||
                        banglaMatch ||
                        surahNameMatch ||
                        surahNumberMatch
                    ) {

                        results.push({

                            surahNumber:
                                surahNumber,

                            surahName:
                                bengaliSurahNames[
                                    surahNumber - 1
                                ]
                                ||
                                `সূরা ${surahNumber}`,

                            ayahNumber:
                                ayah.number,

                            arabic:
                                arabicText,

                            bangla:
                                banglaText

                        });

                    }

                }
            );

        }


        /* =================================================
           কোনো ফলাফল নেই
        ================================================= */

        if (!results.length) {

            resultsBox.innerHTML = `

                <div class="search-empty">
                    ❌ কোনো ফলাফল পাওয়া যায়নি।
                </div>

            `;

            return;

        }


        /* =================================================
           ফলাফল Count
        ================================================= */

        let html = `

            <div class="search-result-count">
                🔎 মোট ${results.length}টি ফলাফল পাওয়া গেছে
            </div>

        `;


        /* =================================================
           ফলাফল দেখানো
        ================================================= */

        results.forEach(
            function(item) {

                html += `

                    <div
                        class="search-result-item"
                        data-surah="${item.surahNumber}"
                        data-ayah="${item.ayahNumber}"
                    >

                        <div class="search-result-surah">

                            ${highlightSearchText(
                                item.surahName,
                                query
                            )}

                            • আয়াত ${item.ayahNumber}

                        </div>


                        <div
                            class="search-result-arabic"
                            dir="rtl"
                        >

                            ${highlightSearchText(
                                item.arabic,
                                query
                            )}

                        </div>


                        ${
                            item.bangla
                            ? `

                                <div class="search-result-translation">

                                    ${highlightSearchText(
                                        item.bangla,
                                        query
                                    )}

                                </div>

                            `
                            : ""
                        }

                    </div>

                `;

            }
        );


        resultsBox.innerHTML =
            html;


        /* =================================================
           Search Result Click
        ================================================= */

        resultsBox
            .querySelectorAll(
                ".search-result-item"
            )
            .forEach(
                function(item) {

                    item.addEventListener(
                        "click",
                        function() {

                            const surahNumber =
                                Number(
                                    this.dataset.surah
                                );


                            const ayahNumber =
                                Number(
                                    this.dataset.ayah
                                );


                            const surahSelect =
                                document.getElementById(
                                    "surahSelect"
                                );


                            const ayahSelect =
                                document.getElementById(
                                    "ayahSelect"
                                );


                            /* =========================
                               Quran Page
                            ========================= */

                            if (
                                typeof showPage ===
                                "function"
                            ) {

                                showPage(
                                    "quranPage"
                                );

                            }


                            /* =========================
                               সূরা নির্বাচন
                            ========================= */

                            if (surahSelect) {

                                surahSelect.value =
                                    String(
                                        surahNumber
                                    );


                                surahSelect.dispatchEvent(
                                    new Event(
                                        "change"
                                    )
                                );

                            }


                            /* =========================
                               আয়াত নির্বাচন + সূরা খোলা
                            ========================= */

                            setTimeout(
                                function() {

                                    if (
                                        ayahSelect
                                    ) {

                                        ayahSelect.value =
                                            String(
                                                ayahNumber
                                            );

                                    }


                                    loadSurah(
                                        surahNumber,
                                        ayahNumber
                                    );

                                },
                                100
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       Search Button
    ===================================================== */

    searchBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            doSearch();

        }
    );


    /* =====================================================
       Enter Key Search
    ===================================================== */

    searchInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                doSearch();

            }

        }
    );

}


/* =========================================================
   DOM Ready
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startQuranApp
    );


    document.addEventListener(
        "DOMContentLoaded",
        initQuranSearch
    );

} else {

    startQuranApp();

    initQuranSearch();

}