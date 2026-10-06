/* =====================================================
QURAN SHARIF — HADITH BOOK / CHAPTER / READER
গ্রন্থ → অধ্যায় → হাদিস

সহীহ বুখারী
সহীহ মুসলিম
জামে আত-তিরমিজি
সুনান আবু দাউদ
সুনান আন-নাসাঈ

===================================================== */


/* =====================================================
১. ডেটা ফাইলের পথ
===================================================== */

const BUKHARI_BASE_PATH =
  "data/hadith/bukhari/";

const MUSLIM_BASE_PATH =
  "data/hadith/muslim/";

const TIRMIDHI_BASE_PATH =
  "data/hadith/tirmidhi/";


/* =====================================================
২. অনলাইন Optional Hadith Data
===================================================== */

const ABUDAUD_META_URL =
  "https://raw.githubusercontent.com/Maksud141/quran-sharif-data/main/hadith/abudaud/Meta/abudaud.json";

const ABUDAUD_CHAPTER_URL =
  "https://raw.githubusercontent.com/Maksud141/quran-sharif-data/main/hadith/abudaud/Chapter/";


const NASAI_META_URL =
  "https://raw.githubusercontent.com/Maksud141/quran-sharif-data/main/hadith/nasai/Meta/nasai.json";

const NASAI_CHAPTER_URL =
  "https://raw.githubusercontent.com/Maksud141/quran-sharif-data/main/hadith/nasai/Chapter/";


/* =====================================================
৩. অধ্যায়ের তালিকা
===================================================== */

let bukhariChapters = [];
let muslimChapters = [];
let tirmidhiChapters = [];

let selectedHadithBook = null;


/* =====================================================
৪. HTML ELEMENT
===================================================== */

/*
   গুরুত্বপূর্ণ:
   এগুলো সরাসরি script load হওয়ার সময় নেওয়া হচ্ছে না।
   কারণ script যদি <head>-এ থাকে তাহলে HTML element
   তখনও তৈরি নাও হতে পারে।
*/

let hadithBookList = null;
let hadithChapterPage = null;
let hadithReaderPage = null;

let hadithChapterTitle = null;
let hadithChapterList = null;

let hadithReaderTitle = null;
let hadithReaderList = null;

let hadithBooksBack = null;
let hadithChaptersBack = null;


/* =====================================================
৫. HTML ELEMENT INITIALIZE
===================================================== */

function initHadithElements() {

  hadithBookList =
    document.getElementById("hadithBookList");

  hadithChapterPage =
    document.getElementById("hadithChapterPage");

  hadithReaderPage =
    document.getElementById("hadithReaderPage");

  hadithChapterTitle =
    document.getElementById("hadithChapterTitle");

  hadithChapterList =
    document.getElementById("hadithChapterList");

  hadithReaderTitle =
    document.getElementById("hadithReaderTitle");

  hadithReaderList =
    document.getElementById("hadithReaderList");

  hadithBooksBack =
    document.getElementById("hadithBooksBack");

  hadithChaptersBack =
    document.getElementById("hadithChaptersBack");
}


/* =====================================================
৬. বাংলা সংখ্যা → ইংরেজি সংখ্যা
===================================================== */

function hadithEnglishDigits(value) {

  const digits =
    "০১২৩৪৫৬৭৮৯";

  return String(value ?? "").replace(
    /[০-৯]/g,
    char => String(digits.indexOf(char))
  );
}


/* =====================================================
৭. JSON LOAD
===================================================== */

async function loadHadithJSON(path) {

  const response =
    await fetch(path);

  if (!response.ok) {

    throw new Error(
      `ফাইল পাওয়া যায়নি: ${path} (${response.status})`
    );
  }

  return response.json();
}


/* =====================================================
৮. JSON → অধ্যায়ের তালিকা
===================================================== */

function normalizeHadithChapters(data) {

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    Array.isArray(data.chapters)
  ) {
    return data.chapters;
  }

  if (
    data &&
    Array.isArray(data.data)
  ) {
    return data.data;
  }

  if (
    data &&
    typeof data === "object"
  ) {

    return Object.entries(data).map(
      ([key, value]) => ({

        chapter_number: key,

        ...(value &&
        typeof value === "object"
          ? value
          : {
              title: String(value)
            })

      })
    );
  }

  throw new Error(
    "অধ্যায়ের JSON কাঠামো সঠিক নয়।"
  );
}


/* =====================================================
৯. অধ্যায়ের নম্বর
===================================================== */

function getHadithChapterNumber(
  chapter,
  index = 0
) {

  const value =
    chapter?.chapter_number ??
    chapter?.chapterNumber ??
    chapter?.chapter_id ??
    chapter?.chapterId ??
    chapter?.number ??
    chapter?.id ??
    index + 1;

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : index + 1;
}


/* =====================================================
১০. অধ্যায়ের নাম
===================================================== */

function getHadithChapterTitle(
  chapter,
  number
) {

  return (
    chapter?.title ??
    chapter?.name ??
    chapter?.chapter_name ??
    chapter?.chapterName ??
    chapter?.chapter ??
    `অধ্যায় ${number}`
  );
}


/* =====================================================
১১. PAGE CHANGE
===================================================== */

function openHadithPage(pageId) {

  if (
    typeof window.showPage ===
    "function"
  ) {

    window.showPage(pageId);

    return;
  }


  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.toggle(
        "active",
        page.id === pageId
      );

    });


  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}


/* =====================================================
১২. BACK
===================================================== */

function backToHadithBooks() {

  openHadithPage(
    "hadithPage"
  );
}


function backToHadithChapters() {

  openHadithPage(
    "hadithChapterPage"
  );
}


/* =====================================================
১৩. HADITH BOOK LIST
===================================================== */

function initHadithBooks() {

  if (!hadithBookList) {

    console.error(
      "hadithBookList HTML element পাওয়া যায়নি।"
    );

    return;
  }


  if (
    hadithBookList.dataset
      .hadithInitialized === "true"
  ) {

    return;
  }


  hadithBookList.dataset
    .hadithInitialized = "true";


  hadithBookList.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-book]"
        );


      if (
        !button ||
        !hadithBookList.contains(button)
      ) {

        return;
      }


      const book =
        button.dataset.book;


      try {

        if (book === "bukhari") {

          selectedHadithBook =
            "bukhari";

          await openBukhariChapters();

        }

        else if (book === "muslim") {

          selectedHadithBook =
            "muslim";

          await openMuslimChapters();

        }

        else if (book === "tirmidhi") {

          selectedHadithBook =
            "tirmidhi";

          await openTirmidhiChapters();

        }

        else if (book === "nasai") {

          selectedHadithBook =
            "nasai";

          await openNasaiChapters();

        }

        else if (book === "abudaud") {

          selectedHadithBook =
            "abudaud";

          await openAbuDaudChapters();

        }

      }

      catch (error) {

        console.error(
          "হাদিস বই খোলার সমস্যা:",
          error
        );

      }

    }
  );
}


/* =====================================================
১৪. অধ্যায়ের তালিকা দেখানো
===================================================== */

function renderHadithChapters(
  chapters,
  bookName
) {

  if (!hadithChapterList) {

    throw new Error(
      "hadithChapterList HTML element পাওয়া যায়নি।"
    );
  }


  hadithChapterList.innerHTML = "";


  if (!Array.isArray(chapters) ||
      !chapters.length) {

    hadithChapterList.textContent =
      `${bookName}-এর কোনো অধ্যায় পাওয়া যায়নি।`;

    return;
  }


  chapters.forEach(
    (chapter, index) => {

      const number =
        getHadithChapterNumber(
          chapter,
          index
        );


      if (
        !Number.isInteger(number) ||
        number < 1
      ) {

        return;
      }


      const title =
        getHadithChapterTitle(
          chapter,
          number
        );


      const range =
        chapter?.hadis_range
          ? `হাদিস: ${chapter.hadis_range}`
          : chapter?.hadith_range
            ? `হাদিস: ${chapter.hadith_range}`
            : chapter?.hadisRange
              ? `হাদিস: ${chapter.hadisRange}`
              : "";


      const button =
        document.createElement(
          "button"
        );


      button.type = "button";

      button.className =
        "hadith-chapter-card";


      button.dataset.chapter =
        String(number);


      button.dataset.book =
        selectedHadithBook;


      const name =
        document.createElement(
          "strong"
        );


      name.textContent =
        `${number}. ${title}`;


      button.appendChild(name);


      if (range) {

        button.appendChild(
          document.createElement("br")
        );


        const details =
          document.createElement(
            "span"
          );


        details.textContent =
          range;


        button.appendChild(
          details
        );
      }


      hadithChapterList.appendChild(
        button
      );

    }
  );


  if (
    !hadithChapterList.children.length
  ) {

    hadithChapterList.textContent =
      `${bookName}-এর কোনো অধ্যায় পাওয়া যায়নি।`;
  }
}


/* =====================================================
১৫. বুখারি অধ্যায়
===================================================== */

async function openBukhariChapters() {

  if (
    !hadithChapterTitle ||
    !hadithChapterList
  ) {

    console.error(
      "অধ্যায়ের HTML element পাওয়া যায়নি।"
    );

    return;
  }


  selectedHadithBook =
    "bukhari";


  openHadithPage(
    "hadithChapterPage"
  );


  hadithChapterTitle.textContent =
    "📕 সহীহ বুখারী — অধ্যায়সমূহ";


  hadithChapterList.innerHTML =
    `<p>অধ্যায় লোড হচ্ছে...</p>`;


  try {

    if (!bukhariChapters.length) {

      const data =
        await loadHadithJSON(
          BUKHARI_BASE_PATH +
          "bukhari.json"
        );


      bukhariChapters =
        normalizeHadithChapters(
          data
        );
    }


    renderHadithChapters(
      bukhariChapters,
      "সহীহ বুখারী"
    );

  }

  catch (error) {

    console.error(
      "বুখারির অধ্যায় লোডের সমস্যা:",
      error
    );


    hadithChapterList.textContent =
      "বুখারির অধ্যায় লোড হয়নি। " +
      "bukhari.json-এর পথ ও কাঠামো পরীক্ষা করুন।";
  }
}


/* =====================================================
১৬. মুসলিম অধ্যায়
===================================================== */

async function openMuslimChapters() {

  if (
    !hadithChapterTitle ||
    !hadithChapterList
  ) {

    console.error(
      "অধ্যায়ের HTML element পাওয়া যায়নি।"
    );

    return;
  }


  selectedHadithBook =
    "muslim";


  openHadithPage(
    "hadithChapterPage"
  );


  hadithChapterTitle.textContent =
    "📗 সহীহ মুসলিম — অধ্যায়সমূহ";


  hadithChapterList.innerHTML =
    `<p>অধ্যায় লোড হচ্ছে...</p>`;


  try {

    if (!muslimChapters.length) {

      const data =
        await loadHadithJSON(
          MUSLIM_BASE_PATH +
          "muslim.json"
        );


      muslimChapters =
        normalizeHadithChapters(
          data
        );
    }


    renderHadithChapters(
      muslimChapters,
      "সহীহ মুসলিম"
    );

  }

  catch (error) {

    console.error(
      "মুসলিমের অধ্যায় লোডের সমস্যা:",
      error
    );


    hadithChapterList.textContent =
      "মুসলিমের অধ্যায় লোড হয়নি। " +
      "muslim.json-এর পথ ও কাঠামো পরীক্ষা করুন।";
  }
}


/* =====================================================
১৭. তিরমিজি অধ্যায়
===================================================== */

async function openTirmidhiChapters() {

  if (
    !hadithChapterTitle ||
    !hadithChapterList
  ) {

    console.error(
      "অধ্যায়ের HTML element পাওয়া যায়নি।"
    );

    return;
  }


  selectedHadithBook =
    "tirmidhi";


  openHadithPage(
    "hadithChapterPage"
  );


  hadithChapterTitle.textContent =
    "📕 জামে আত-তিরমিজি — অধ্যায়সমূহ";


  hadithChapterList.innerHTML =
    `<p>অধ্যায় লোড হচ্ছে...</p>`;


  try {

    if (!tirmidhiChapters.length) {

      const data =
        await loadHadithJSON(
          TIRMIDHI_BASE_PATH +
          "tirmidhi.json"
        );


      tirmidhiChapters =
        normalizeHadithChapters(
          data
        );
    }


    renderHadithChapters(
      tirmidhiChapters,
      "জামে আত-তিরমিজি"
    );

  }

  catch (error) {

    console.error(
      "তিরমিজির অধ্যায় লোডের সমস্যা:",
      error
    );


    hadithChapterList.textContent =
      "তিরমিজির অধ্যায় লোড হয়নি। " +
      "tirmidhi.json-এর পথ পরীক্ষা করুন।";
  }
}


/* =====================================================
১৮. CHAPTER CLICK
===================================================== */

function initHadithChapterClick() {

  if (!hadithChapterList) {
    return;
  }


  if (
    hadithChapterList.dataset
      .listenerAdded === "true"
  ) {

    return;
  }


  hadithChapterList.dataset
    .listenerAdded = "true";


  hadithChapterList.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-chapter]"
        );


      if (
        !button ||
        !hadithChapterList.contains(button)
      ) {

        return;
      }


      const chapterNumber =
        Number(
          button.dataset.chapter
        );


      const book =
        button.dataset.book ||
        selectedHadithBook;


      if (
        !Number.isInteger(chapterNumber) ||
        chapterNumber < 1
      ) {

        return;
      }


      if (book === "muslim") {

        openMuslimHadith(
          chapterNumber
        );

      }

      else if (book === "bukhari") {

        openBukhariHadith(
          chapterNumber
        );

      }

      else if (book === "tirmidhi") {

        openTirmidhiHadith(
          chapterNumber
        );

      }

      else if (book === "nasai") {

        openNasaiHadith(
          chapterNumber
        );

      }

      else if (book === "abudaud") {

        openAbuDaudHadith(
          chapterNumber
        );
      }

    }
  );
}


/* =====================================================
১৯. JSON → HADITH LIST
===================================================== */

function normalizeHadithList(data) {

  if (Array.isArray(data)) {
    return data;
  }


  if (
    data &&
    Array.isArray(data.hadiths)
  ) {

    return data.hadiths;
  }


  if (
    data &&
    Array.isArray(data.hadis)
  ) {

    return data.hadis;
  }


  if (
    data &&
    Array.isArray(data.data)
  ) {

    return data.data;
  }


  return (
    data &&
    typeof data === "object"
      ? [data]
      : []
  );
}


/* =====================================================
২০. HADITH CARD
===================================================== */

function renderHadithList(
  hadiths
) {

  if (!hadithReaderList) {

    throw new Error(
      "hadithReaderList HTML element পাওয়া যায়নি।"
    );
  }


  hadithReaderList.innerHTML = "";


  if (
    !Array.isArray(hadiths) ||
    !hadiths.length
  ) {

    hadithReaderList.textContent =
      "এই অধ্যায়ে কোনো হাদিস পাওয়া যায়নি।";

    return;
  }


  hadiths.forEach(
    (hadith, index) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "hadith-card";


      const number =
        hadith?.hadith_id ??
        hadith?.hadith_number ??
        hadith?.hadithNumber ??
        hadith?.id ??
        index + 1;


      const narrator =
        hadith?.narrator ??
        hadith?.rawi ??
        hadith?.raawi ??
        "";


      const arabic =
        hadith?.ar ??
        hadith?.arabic ??
        hadith?.arab ??
        "";


      const bengali =
        hadith?.bn ??
        hadith?.bengali ??
        hadith?.translation ??
        hadith?.text ??
        "";


      const grade =
        hadith?.grade ??
        "";


      const note =
        hadith?.note ??
        "";


      /* ---------- Number ---------- */

      const heading =
        document.createElement(
          "h3"
        );


      heading.textContent =
        `হাদিস নং ${hadithEnglishDigits(number)}`;


      card.appendChild(
        heading
      );


      /* ---------- Narrator ---------- */

      if (narrator) {

        const element =
          document.createElement(
            "p"
          );


        element.className =
          "hadith-narrator";


        element.textContent =
          `বর্ণনাকারী: ${narrator}`;


        card.appendChild(
          element
        );
      }


      /* ---------- Arabic ---------- */

      if (arabic) {

        const element =
          document.createElement(
            "p"
          );


        element.className =
          "hadith-arabic";


        element.lang = "ar";

        element.dir = "rtl";


        element.textContent =
          arabic;


        card.appendChild(
          element
        );
      }


      /* ---------- Bengali ---------- */

      if (bengali) {

        const element =
          document.createElement(
            "p"
          );


        element.className =
          "hadith-bengali";


        element.textContent =
          bengali;


        card.appendChild(
          element
        );
      }


      /* ---------- Grade ---------- */

      if (grade) {

        const element =
          document.createElement(
            "p"
          );


        element.className =
          "hadith-grade";


        element.textContent =
          `মান: ${grade}`;


        if (
          hadith?.grade_color
        ) {

          element.style.color =
            hadith.grade_color;
        }


        card.appendChild(
          element
        );
      }


      /* ---------- Note ---------- */

      if (note) {

        const element =
          document.createElement(
            "p"
          );


        element.className =
          "hadith-note";


        element.textContent =
          note;


        card.appendChild(
          element
        );
      }


      hadithReaderList.appendChild(
        card
      );

    }
  );
}


/* =====================================================
২১. BUKHARI HADITH
===================================================== */

async function openBukhariHadith(
  chapterNumber
) {

  if (
    !hadithReaderTitle ||
    !hadithReaderList
  ) {

    return;
  }


  selectedHadithBook =
    "bukhari";


  openHadithPage(
    "hadithReaderPage"
  );


  const chapter =
    bukhariChapters.find(
      (item, index) =>
        getHadithChapterNumber(
          item,
          index
        ) === chapterNumber
    );


  const title =
    getHadithChapterTitle(
      chapter,
      chapterNumber
    );


  hadithReaderTitle.textContent =
    `📕 সহীহ বুখারী — ${title}`;


  hadithReaderList.innerHTML =
    `<p>হাদিস লোড হচ্ছে...</p>`;


  try {

    const path =
      `${BUKHARI_BASE_PATH}Chapter/${chapterNumber}.json`;


    const data =
      await loadHadithJSON(path);


    renderHadithList(
      normalizeHadithList(data)
    );

  }

  catch (error) {

    console.error(
      "বুখারির হাদিস লোডের সমস্যা:",
      error
    );


    hadithReaderList.textContent =
      `হাদিস লোড হয়নি। ` +
      `Chapter/${chapterNumber}.json ফাইলটি পরীক্ষা করুন।`;
  }
}


/* =====================================================
২২. MUSLIM HADITH
===================================================== */

async function openMuslimHadith(
  chapterNumber
) {

  if (
    !hadithReaderTitle ||
    !hadithReaderList
  ) {

    return;
  }


  selectedHadithBook =
    "muslim";


  openHadithPage(
    "hadithReaderPage"
  );


  const chapter =
    muslimChapters.find(
      (item, index) =>
        getHadithChapterNumber(
          item,
          index
        ) === chapterNumber
    );


  const title =
    getHadithChapterTitle(
      chapter,
      chapterNumber
    );


  hadithReaderTitle.textContent =
    `📗 সহীহ মুসলিম — ${title}`;


  hadithReaderList.innerHTML =
    `<p>হাদিস লোড হচ্ছে...</p>`;


  try {

    const path =
      `${MUSLIM_BASE_PATH}Chapter/${chapterNumber}.json`;


    const data =
      await loadHadithJSON(path);


    renderHadithList(
      normalizeHadithList(data)
    );

  }

  catch (error) {

    console.error(
      "মুসলিমের হাদিস লোডের সমস্যা:",
      error
    );


    hadithReaderList.textContent =
      `হাদিস লোড হয়নি। ` +
      `Chapter/${chapterNumber}.json ফাইলটি পরীক্ষা করুন।`;
  }
}


/* =====================================================
২৩. TIRMIDHI HADITH
===================================================== */

async function openTirmidhiHadith(
  chapterNumber
) {

  if (
    !hadithReaderTitle ||
    !hadithReaderList
  ) {

    return;
  }


  selectedHadithBook =
    "tirmidhi";


  openHadithPage(
    "hadithReaderPage"
  );


  const chapter =
    tirmidhiChapters.find(
      (item, index) =>
        getHadithChapterNumber(
          item,
          index
        ) === chapterNumber
    );


  const title =
    getHadithChapterTitle(
      chapter,
      chapterNumber
    );


  hadithReaderTitle.textContent =
    `📕 জামে আত-তিরমিজি — ${title}`;


  hadithReaderList.innerHTML =
    `<p>হাদিস লোড হচ্ছে...</p>`;


  try {

    const path =
      `${TIRMIDHI_BASE_PATH}Chapter/${chapterNumber}.json`;


    const data =
      await loadHadithJSON(path);


    renderHadithList(
      normalizeHadithList(data)
    );

  }

  catch (error) {

    console.error(
      "তিরমিজির হাদিস লোডের সমস্যা:",
      error
    );


    hadithReaderList.textContent =
      `হাদিস লোড হয়নি। ` +
      `Chapter/${chapterNumber}.json ফাইলটি পরীক্ষা করুন।`;
  }
}


/* =====================================================
২৪. BACK BUTTON
===================================================== */

function initHadithBackButtons() {

  if (hadithBooksBack) {

    hadithBooksBack.addEventListener(
      "click",
      backToHadithBooks
    );
  }


  if (hadithChaptersBack) {

    hadithChaptersBack.addEventListener(
      "click",
      backToHadithChapters
    );
  }
}


/* =====================================================
২৫. INDEXED DB
===================================================== */

const OPTIONAL_HADITH_DB =
  "QuranSharifOptionalHadith";

const OPTIONAL_HADITH_STORE =
  "chapters";


function openOptionalHadithDB() {

  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          OPTIONAL_HADITH_DB,
          1
        );


      request.onupgradeneeded =
        () => {

          const db =
            request.result;


          if (
            !db.objectStoreNames
              .contains(
                OPTIONAL_HADITH_STORE
              )
          ) {

            db.createObjectStore(
              OPTIONAL_HADITH_STORE,
              {
                keyPath: "key"
              }
            );
          }
        };


      request.onsuccess =
        () => {

          resolve(
            request.result
          );
        };


      request.onerror =
        () => {

          reject(
            request.error
          );
        };

    }
  );
}


/* =====================================================
২৬. SAVE OPTIONAL HADITH
===================================================== */

async function saveOptionalHadith(
  key,
  value
) {

  const db =
    await openOptionalHadithDB();


  return new Promise(
    (resolve, reject) => {

      const tx =
        db.transaction(
          OPTIONAL_HADITH_STORE,
          "readwrite"
        );


      tx.objectStore(
        OPTIONAL_HADITH_STORE
      ).put({

        key,
        value,
        savedAt: Date.now()

      });


      tx.oncomplete =
        () => {

          db.close();

          resolve();
        };


      tx.onerror =
        () => {

          db.close();

          reject(
            tx.error
          );
        };


      tx.onabort =
        () => {

          db.close();

          reject(
            tx.error ||
            new Error(
              "ডেটা সংরক্ষণ করা যায়নি"
            )
          );
        };

    }
  );
}


/* =====================================================
২৭. GET OPTIONAL HADITH
===================================================== */

async function getOptionalHadith(
  key
) {

  const db =
    await openOptionalHadithDB();


  return new Promise(
    (resolve, reject) => {

      const tx =
        db.transaction(
          OPTIONAL_HADITH_STORE,
          "readonly"
        );


      const request =
        tx.objectStore(
          OPTIONAL_HADITH_STORE
        ).get(key);


      request.onsuccess =
        () => {

          db.close();

          resolve(
            request.result
              ? request.result.value
              : null
          );
        };


      request.onerror =
        () => {

          db.close();

          reject(
            request.error
          );
        };

    }
  );
}


/* =====================================================
২৮. ABU DAUD DOWNLOAD
===================================================== */

async function downloadAbuDaudBook() {

  const button =
    document.getElementById(
      "abudaudDownloadBtn"
    );


  const status =
    document.getElementById(
      "abudaudDownloadStatus"
    );


  const progress =
    document.getElementById(
      "abudaudDownloadProgress"
    );


  if (
    !button ||
    !status ||
    !progress
  ) {

    console.error(
      "Abu Daud download HTML element পাওয়া যায়নি।"
    );

    return;
  }


  button.disabled = true;

  progress.hidden = false;

  progress.value = 0;


  try {

    status.textContent =
      "অধ্যায়ের তালিকা ডাউনলোড হচ্ছে...";


    const metaResponse =
      await fetch(
        ABUDAUD_META_URL
      );


    if (!metaResponse.ok) {

      throw new Error(
        "অধ্যায়ের তালিকা পাওয়া যায়নি"
      );
    }


    const meta =
      await metaResponse.json();


    const chapters =
      normalizeHadithChapters(
        meta
      )
      .map(
        (chapter, index) => ({

          ...chapter,

          chapter_number:
            getHadithChapterNumber(
              chapter,
              index
            )

        })
      )
      .filter(
        chapter =>
          Number.isInteger(
            chapter.chapter_number
          ) &&
          chapter.chapter_number >= 1 &&
          chapter.chapter_number <= 43
      );


    if (
      chapters.length !== 43
    ) {

      throw new Error(
        `৪৩টি অধ্যায় পাওয়া যায়নি; পাওয়া গেছে ${chapters.length}টি`
      );
    }


    await saveOptionalHadith(
      "abudaud:meta",
      chapters
    );


    progress.max =
      chapters.length;


    let completed = 0;


    for (
      const chapter of chapters
    ) {

      const number =
        chapter.chapter_number;


      status.textContent =
        `অধ্যায় ${number}/${chapters.length} ডাউনলোড হচ্ছে...`;


      const response =
        await fetch(
          `${ABUDAUD_CHAPTER_URL}${number}.json`
        );


      if (!response.ok) {

        throw new Error(
          `অধ্যায় ${number} ডাউনলোড হয়নি`
        );
      }


      const data =
        await response.json();


      const hadiths =
        normalizeHadithList(
          data
        );


      if (!hadiths.length) {

        throw new Error(
          `অধ্যায় ${number}-এ হাদিস পাওয়া যায়নি`
        );
      }


      await saveOptionalHadith(
        `abudaud:chapter:${number}`,
        hadiths
      );


      completed++;

      progress.value =
        completed;
    }


    await saveOptionalHadith(
      "abudaud:downloaded",
      true
    );


    status.textContent =
      "ডাউনলোড সম্পূর্ণ ✓ এখন অফলাইনে পড়তে পারবেন";


    moveAbuDaudToOfflineSection();

  }

  catch (error) {

    console.error(
      "আবু দাউদ ডাউনলোড সমস্যা:",
      error
    );


    status.textContent =
      `ডাউনলোড সম্পূর্ণ হয়নি: ${error.message}। আবার চেষ্টা করুন।`;


    button.textContent =
      "আবার ডাউনলোড করুন";
  }

  finally {

    button.disabled = false;
  }
}


/* =====================================================
২৯. NASA'I DOWNLOAD
===================================================== */

async function downloadNasaiBook() {

  const button =
    document.getElementById(
      "nasaiDownloadBtn"
    );


  const status =
    document.getElementById(
      "nasaiDownloadStatus"
    );


  const progress =
    document.getElementById(
      "nasaiDownloadProgress"
    );


  if (
    !button ||
    !status ||
    !progress
  ) {

    console.error(
      "Nasai download HTML element পাওয়া যায়নি।"
    );

    return;
  }


  button.disabled = true;

  progress.hidden = false;

  progress.value = 0;


  try {

    status.textContent =
      "অধ্যায়ের তালিকা ডাউনলোড হচ্ছে...";


    const metaResponse =
      await fetch(
        NASAI_META_URL
      );


    if (!metaResponse.ok) {

      throw new Error(
        "নাসাঈর অধ্যায়ের তালিকা পাওয়া যায়নি"
      );
    }


    const meta =
      await metaResponse.json();


    const chapters =
      normalizeHadithChapters(
        meta
      )
      .map(
        (chapter, index) => ({

          ...chapter,

          chapter_number:
            getHadithChapterNumber(
              chapter,
              index
            )

        })
      )
      .filter(
        chapter =>
          Number.isInteger(
            chapter.chapter_number
          ) &&
          chapter.chapter_number >= 1 &&
          chapter.chapter_number <= 50
      );


    if (
      chapters.length !== 50
    ) {

      throw new Error(
        `৫০টি অধ্যায় পাওয়া যায়নি; পাওয়া গেছে ${chapters.length}টি`
      );
    }


    await saveOptionalHadith(
      "nasai:meta",
      chapters
    );


    progress.max =
      chapters.length;


    let completed = 0;


    for (
      const chapter of chapters
    ) {

      const number =
        chapter.chapter_number;


      status.textContent =
        `অধ্যায় ${number}/${chapters.length} ডাউনলোড হচ্ছে...`;


      const response =
        await fetch(
          `${NASAI_CHAPTER_URL}${number}.json`
        );


      if (!response.ok) {

        throw new Error(
          `অধ্যায় ${number} ডাউনলোড হয়নি`
        );
      }


      const data =
        await response.json();


      const hadiths =
        normalizeHadithList(
          data
        );


      if (!hadiths.length) {

        throw new Error(
          `অধ্যায় ${number}-এ হাদিস পাওয়া যায়নি`
        );
      }


      await saveOptionalHadith(
        `nasai:chapter:${number}`,
        hadiths
      );


      completed++;

      progress.value =
        completed;
    }


    await saveOptionalHadith(
      "nasai:downloaded",
      true
    );


    status.textContent =
      "ডাউনলোড সম্পূর্ণ ✓ এখন অফলাইনে পড়তে পারবেন";


    moveNasaiToOfflineSection();

  }

  catch (error) {

    console.error(
      "নাসাঈ ডাউনলোড সমস্যা:",
      error
    );


    status.textContent =
      `ডাউনলোড সম্পূর্ণ হয়নি: ${error.message}। আবার চেষ্টা করুন。`;


    button.textContent =
      "আবার ডাউনলোড করুন";
  }

  finally {

    button.disabled = false;
  }
}


/* =====================================================
৩০. ABU DAUD DOWNLOAD BUTTON
===================================================== */

function initAbuDaudDownloadButton() {

  const button =
    document.getElementById(
      "abudaudDownloadBtn"
    );


  if (
    !button ||
    button.dataset.listenerAdded === "true"
  ) {

    return;
  }


  button.dataset.listenerAdded =
    "true";


  button.addEventListener(
    "click",
    async () => {

      const downloaded =
        await getOptionalHadith(
          "abudaud:downloaded"
        ).catch(
          () => false
        );


      if (downloaded === true) {

        await openAbuDaudChapters();

      }

      else {

        await downloadAbuDaudBook();
      }

    }
  );
}


/* =====================================================
৩১. NASA'I DOWNLOAD BUTTON
===================================================== */

function initNasaiDownloadButton() {

  const button =
    document.getElementById(
      "nasaiDownloadBtn"
    );


  if (
    !button ||
    button.dataset.listenerAdded === "true"
  ) {

    return;
  }


  button.dataset.listenerAdded =
    "true";


  button.addEventListener(
    "click",
    async () => {

      const downloaded =
        await getOptionalHadith(
          "nasai:downloaded"
        ).catch(
          () => false
        );


      if (downloaded === true) {

        await openNasaiChapters();

      }

      else {

        await downloadNasaiBook();
      }

    }
  );
}


/* =====================================================
৩২. ABU DAUD OFFLINE CHAPTER
===================================================== */

async function openAbuDaudChapters() {

  if (
    !hadithChapterTitle ||
    !hadithChapterList
  ) {

    return;
  }


  selectedHadithBook =
    "abudaud";


  openHadithPage(
    "hadithChapterPage"
  );


  hadithChapterTitle.textContent =
    "📗 সুনান আবু দাউদ — অধ্যায়সমূহ";


  hadithChapterList.innerHTML =
    `<p>সংরক্ষিত অধ্যায় লোড হচ্ছে...</p>`;


  try {

    const downloaded =
      await getOptionalHadith(
        "abudaud:downloaded"
      );


    const chapters =
      await getOptionalHadith(
        "abudaud:meta"
      );


    if (
      downloaded !== true ||
      !Array.isArray(chapters)
    ) {

      throw new Error(
        "আগে কিতাবটি ডাউনলোড করুন।"
      );
    }


    renderHadithChapters(
      chapters,
      "সুনান আবু দাউদ"
    );

  }

  catch (error) {

    console.error(
      "আবু দাউদের অধ্যায় লোডের সমস্যা:",
      error
    );


    hadithChapterList.textContent =
      error.message;
  }
}


/* =====================================================
৩৩. ABU DAUD OFFLINE HADITH
===================================================== */

async function openAbuDaudHadith(
  chapterNumber
) {

  if (
    !hadithReaderTitle ||
    !hadithReaderList
  ) {

    return;
  }


  selectedHadithBook =
    "abudaud";


  openHadithPage(
    "hadithReaderPage"
  );


  hadithReaderTitle.textContent =
    `📕 সুনান আবু দাউদ — অধ্যায় ${chapterNumber}`;


  hadithReaderList.innerHTML =
    `<p>সংরক্ষিত হাদিস লোড হচ্ছে...</p>`;


  try {

    const hadiths =
      await getOptionalHadith(
        `abudaud:chapter:${chapterNumber}`
      );


    if (
      !Array.isArray(hadiths)
    ) {

      throw new Error(
        "এই অধ্যায় ডাউনলোড করা নেই।"
      );
    }


    renderHadithList(
      hadiths
    );

  }

  catch (error) {

    console.error(
      "আবু দাউদের হাদিস লোডের সমস্যা:",
      error
    );


    hadithReaderList.textContent =
      error.message;
  }
}


/* =====================================================
৩৪. NASA'I OFFLINE CHAPTER
===================================================== */

async function openNasaiChapters() {

  if (
    !hadithChapterTitle ||
    !hadithChapterList
  ) {

    return;
  }


  selectedHadithBook =
    "nasai";


  openHadithPage(
    "hadithChapterPage"
  );


  hadithChapterTitle.textContent =
    "📕 সুনান আন-নাসাঈ — অধ্যায়সমূহ";


  hadithChapterList.innerHTML =
    `<p>সংরক্ষিত অধ্যায় লোড হচ্ছে...</p>`;


  try {

    const downloaded =
      await getOptionalHadith(
        "nasai:downloaded"
      );


    const chapters =
      await getOptionalHadith(
        "nasai:meta"
      );


    if (
      downloaded !== true ||
      !Array.isArray(chapters)
    ) {

      throw new Error(
        "আগে কিতাবটি ডাউনলোড করুন।"
      );
    }


    if (
      chapters.length !== 50
    ) {

      throw new Error(
        `নাসাঈর ৫০টি অধ্যায় পাওয়া যায়নি; পাওয়া গেছে ${chapters.length}টি`
      );
    }


    renderHadithChapters(
      chapters,
      "সুনান আন-নাসাঈ"
    );

  }

  catch (error) {

    console.error(
      "নাসাঈর অধ্যায় লোডের সমস্যা:",
      error
    );


    hadithChapterList.textContent =
      error.message;
  }
}


/* =====================================================
৩৫. NASA'I OFFLINE HADITH
===================================================== */

async function openNasaiHadith(
  chapterNumber
) {

  if (
    !hadithReaderTitle ||
    !hadithReaderList
  ) {

    return;
  }


  selectedHadithBook =
    "nasai";


  openHadithPage(
    "hadithReaderPage"
  );


  hadithReaderTitle.textContent =
    `📕 সুনান আন-নাসাঈ — অধ্যায় ${chapterNumber}`;


  hadithReaderList.innerHTML =
    `<p>সংরক্ষিত হাদিস লোড হচ্ছে...</p>`;


  try {

    const hadiths =
      await getOptionalHadith(
        `nasai:chapter:${chapterNumber}`
      );


    if (
      !Array.isArray(hadiths)
    ) {

      throw new Error(
        "এই অধ্যায় ডাউনলোড করা নেই।"
      );
    }


    renderHadithList(
      hadiths
    );

  }

  catch (error) {

    console.error(
      "নাসাঈর হাদিস লোডের সমস্যা:",
      error
    );


    hadithReaderList.textContent =
      error.message;
  }
}


/* =====================================================
৩৬. ABU DAUD → OFFLINE BOOK
===================================================== */

function moveAbuDaudToOfflineSection() {

  const offlineList =
    document.getElementById(
      "hadithBookList"
    );


  const downloadList =
    document.getElementById(
      "hadithDownloadBookList"
    );


  const downloadButton =
    document.getElementById(
      "abudaudDownloadBtn"
    );


  if (
    !offlineList ||
    !downloadList ||
    !downloadButton
  ) {

    return;
  }


  let card =
    offlineList.querySelector(
      '[data-book="abudaud"]'
    );


  if (card) {
    return;
  }


  card =
    downloadButton.closest(
      ".hadith-download-card"
    );


  if (!card) {
    return;
  }


  card.classList.remove(
    "hadith-download-card"
  );


  card.classList.add(
    "hadith-book-card"
  );


  card.dataset.book =
    "abudaud";


  const status =
    card.querySelector(
      "#abudaudDownloadStatus"
    );


  const progress =
    card.querySelector(
      "#abudaudDownloadProgress"
    );


  if (status) {
    status.remove();
  }


  if (progress) {
    progress.remove();
  }


  const label =
    document.createElement(
      "span"
    );


  label.textContent =
    "অধ্যায়সমূহ দেখুন ›";


  downloadButton.replaceWith(
    label
  );


  offlineList.appendChild(
    card
  );
}


/* =====================================================
৩৭. NASA'I → OFFLINE BOOK
===================================================== */

function moveNasaiToOfflineSection() {

  const offlineList =
    document.getElementById(
      "hadithBookList"
    );


  const downloadList =
    document.getElementById(
      "hadithDownloadBookList"
    );


  const downloadButton =
    document.getElementById(
      "nasaiDownloadBtn"
    );


  if (
    !offlineList ||
    !downloadList ||
    !downloadButton
  ) {

    return;
  }


  let card =
    offlineList.querySelector(
      '[data-book="nasai"]'
    );


  if (card) {
    return;
  }


  card =
    downloadButton.closest(
      ".hadith-download-card"
    );


  if (!card) {
    return;
  }


  card.classList.remove(
    "hadith-download-card"
  );


  card.classList.add(
    "hadith-book-card"
  );


  card.dataset.book =
    "nasai";


  const status =
    card.querySelector(
      "#nasaiDownloadStatus"
    );


  const progress =
    card.querySelector(
      "#nasaiDownloadProgress"
    );


  if (status) {
    status.remove();
  }


  if (progress) {
    progress.remove();
  }


  const label =
    document.createElement(
      "span"
    );


  label.textContent =
    "অধ্যায়সমূহ দেখুন ›";


  downloadButton.replaceWith(
    label
  );


  offlineList.appendChild(
    card
  );
}


/* =====================================================
৩৮. RESTORE DOWNLOADED BOOKS
===================================================== */

async function restoreDownloadedHadithBooks() {

  try {

    const abuDaudDownloaded =
      await getOptionalHadith(
        "abudaud:downloaded"
      );


    if (
      abuDaudDownloaded === true
    ) {

      moveAbuDaudToOfflineSection();
    }


    const nasaiDownloaded =
      await getOptionalHadith(
        "nasai:downloaded"
      );


    if (
      nasaiDownloaded === true
    ) {

      moveNasaiToOfflineSection();
    }

  }

  catch (error) {

    console.error(
      "ডাউনলোড করা হাদিস কিতাব restore হয়নি:",
      error
    );
  }
}


/* =====================================================
৩৯. HADITH SYSTEM START
===================================================== */

function initHadithSystem() {

  /* HTML element initialize */
  initHadithElements();


  /* Book click */
  initHadithBooks();


  /* Chapter click */
  initHadithChapterClick();


  /* Back buttons */
  initHadithBackButtons();


  /* Abu Daud download */
  initAbuDaudDownloadButton();


  /* Nasai download */
  initNasaiDownloadButton();


  /* Previously downloaded books */
  restoreDownloadedHadithBooks();
}


/* =====================================================
৪০. DOM READY
===================================================== */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initHadithSystem,
    {
      once: true
    }
  );

}

else {

  initHadithSystem();
}