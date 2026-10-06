// ==========================================
// বাংলা শব্দে শব্দে অর্থ
// Lazy Load + Auto Word Panel
// ==========================================

const banglaSurahCache = {};


// ==========================================
// Word Panel না থাকলে নিজে তৈরি করবে
// ==========================================
function ensureWordPanel() {

    let panel = document.getElementById("word-panel");

    if (panel) {
        return panel;
    }

    panel = document.createElement("div");

    panel.id = "word-panel";
    panel.className = "word-panel";

    panel.innerHTML = `
        <div class="word-panel-overlay"></div>

        <div class="word-panel-box">

            <div class="word-panel-header">

                <div>
                    <strong class="word-panel-title">
                        শব্দে শব্দে অর্থ
                    </strong>

                    <small class="word-panel-subtitle">
                        সূরা • আয়াত
                    </small>
                </div>

                <button
                    class="word-close-btn"
                    type="button"
                >
                    ×
                </button>

            </div>

            <div class="word-arabic"></div>

            <div class="word-list">
                <div class="word-loading">
                    বাংলা অর্থ লোড হচ্ছে...
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(panel);

    return panel;
}


// ==========================================
// নির্দিষ্ট সূরার JSON লোড
// ==========================================
async function loadBanglaSurah(surahNumber) {

    // আগে লোড করা থাকলে আবার লোড করবে না
    if (banglaSurahCache[surahNumber]) {
        return banglaSurahCache[surahNumber];
    }

    const response = await fetch(
        `data/surah-${surahNumber}.json`
    );

    if (!response.ok) {
        throw new Error(
            `data/surah-${surahNumber}.json পাওয়া যায়নি`
        );
    }

    const data = await response.json();

    // Cache
    banglaSurahCache[surahNumber] = data;

    return data;
}


// ==========================================
// Word by Word
// ==========================================
async function openWordByWord(
    surahNumber,
    ayahNumber,
    arabicText
) {

    // Panel তৈরি/খুঁজে বের করবে
    const panel = ensureWordPanel();

    panel.classList.add("show");


    const title =
        panel.querySelector(".word-panel-title");

    const subtitle =
        panel.querySelector(".word-panel-subtitle");

    const arabicBox =
        panel.querySelector(".word-arabic");

    const listBox =
        panel.querySelector(".word-list");


    if (title) {
        title.textContent = "শব্দে শব্দে অর্থ";
    }


    if (subtitle) {
        subtitle.textContent =
            `সূরা ${surahNumber} • আয়াত ${ayahNumber}`;
    }


    if (arabicBox) {
        arabicBox.textContent =
            arabicText || "";
    }


    if (listBox) {
        listBox.innerHTML = `
            <div class="word-loading">
                বাংলা অর্থ লোড হচ্ছে...
            </div>
        `;
    }


    try {

        // শুধু প্রয়োজনীয় সূরার JSON
        const surahData =
            await loadBanglaSurah(surahNumber);


        // নির্দিষ্ট আয়াত
        const ayahData =
            surahData[String(ayahNumber)] || {};


        // Word number
        const wordNumbers =
            Object.keys(ayahData)
                .map(Number)
                .sort((a, b) => a - b);


        if (!wordNumbers.length) {

            listBox.innerHTML = `
                <div class="word-error">
                    এই আয়াতের বাংলা
                    শব্দে-শব্দে অর্থ পাওয়া যায়নি।
                </div>
            `;

            return;
        }


        // আরবি শব্দ ভাগ
        const arabicWords =
            splitArabicWords(arabicText);


        let html = "";


        wordNumbers.forEach(
            (wordNumber, index) => {

                const arabicWord =
                    arabicWords[index] || "";

                const meaning =
                    ayahData[String(wordNumber)] || "";


                html += `
                    <div class="word-item">

                        <div class="word-number">
                            ${wordNumber}
                        </div>

                        <div class="word-arabic-small">
                            ${escapeWordHtml(arabicWord)}
                        </div>

                        <div class="word-bangla">
                            ${escapeWordHtml(meaning)}
                        </div>

                    </div>
                `;
            }
        );


        listBox.innerHTML = html;


    } catch (error) {

        console.error(
            "বাংলা WBW সমস্যা:",
            error
        );


        listBox.innerHTML = `
            <div class="word-error">
                বাংলা শব্দে শব্দে অর্থ
                লোড করা যায়নি।
                আবার চেষ্টা করুন।
            </div>
        `;
    }
}


// ==========================================
// আরবি শব্দ ভাগ
// ==========================================
function splitArabicWords(text) {

    if (!text) {
        return [];
    }

    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}


// ==========================================
// HTML নিরাপদ রাখা
// ==========================================
function escapeWordHtml(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// Panel বন্ধ
// ==========================================
function closeWordByWord() {

    const panel =
        document.getElementById("word-panel");

    if (panel) {
        panel.classList.remove("show");
    }
}


// ==========================================
// Close / Overlay
// ==========================================
document.addEventListener(
    "click",
    function(event) {

        if (
            event.target.closest(".word-close-btn") ||
            event.target.matches(".word-panel-overlay")
        ) {

            closeWordByWord();

        }

    }
);