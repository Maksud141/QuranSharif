/* =========================================================
   QURAN SHARIF
   PRAYER TIME + LOCATION + QIBLA
   =========================================================

   কাজ:
   1. Home Page-এর নামাজের সময়
   2. বিস্তারিত Prayer Page
   3. GPS Location
   4. Manual Country / City / Area
   5. Location Save
   6. Hijri Date
   7. Next Prayer + Countdown
   8. Qibla Direction
   9. Compass
   10. Prayer Time Cache
   11. Midnight-এর পর automatic refresh

========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const PRAYER_LOCATION_STORAGE_KEY =
    "quranSharifLocation";

const PRAYER_TIMINGS_STORAGE_KEY =
    "quranSharifPrayerTimings";

const PRAYER_DATE_STORAGE_KEY =
    "quranSharifPrayerDate";


/* =========================================================
   KAABA LOCATION
========================================================= */

const KAABA_LATITUDE = 21.422487;
const KAABA_LONGITUDE = 39.826206;


/* =========================================================
   LOCATION DATA
========================================================= */

const LOCATION_DATA = {

    "সৌদি আরব": [
        "দাম্মাম",
        "রিয়াদ",
        "জেদ্দা",
        "মক্কা",
        "মদিনা",
        "খোবর",
        "জুবাইল",
        "তাইফ",
        "আল-আহসা",
        "আবহা"
    ],

    "বাংলাদেশ": [
        "ঢাকা",
        "চট্টগ্রাম",
        "সিলেট",
        "রাজশাহী",
        "খুলনা",
        "বরিশাল",
        "রংপুর",
        "ময়মনসিংহ",
        "কুমিল্লা"
    ],

    "ভারত": [
        "দিল্লি",
        "মুম্বাই",
        "কলকাতা",
        "হায়দরাবাদ",
        "চেন্নাই",
        "ব্যাঙ্গালোর",
        "লখনৌ"
    ],

    "পাকিস্তান": [
        "ইসলামাবাদ",
        "করাচি",
        "লাহোর",
        "পেশাওয়ার",
        "কোয়েটা",
        "মুলতান"
    ],

    "সংযুক্ত আরব আমিরাত": [
        "দুবাই",
        "আবুধাবি",
        "শারজাহ",
        "আজমান",
        "আল আইন"
    ],

    "কাতার": [
        "দোহা",
        "আল রায়ান"
    ],

    "কুয়েত": [
        "কুয়েত সিটি",
        "হাওয়ালি"
    ],

    "ওমান": [
        "মাসকাট",
        "সালালাহ",
        "সোহর"
    ],

    "যুক্তরাষ্ট্র": [
        "নিউইয়র্ক",
        "ওয়াশিংটন",
        "শিকাগো",
        "লস অ্যাঞ্জেলেস"
    ],

    "যুক্তরাজ্য": [
        "লন্ডন",
        "বার্মিংহাম",
        "ম্যানচেস্টার"
    ]

};


/* =========================================================
   LOCATION STATE
========================================================= */

let prayerLocation = {

    country: "",
    city: "",
    area: "",

    latitude: null,
    longitude: null,

    source: ""

};


/* =========================================================
   PRAYER STATE
========================================================= */

let currentPrayerTimings = null;

let currentPrayerDate = "";

let currentPrayerTimezone = "";

let prayerCountdownTimer = null;

let midnightRefreshTimer = null;


/* =========================================================
   QIBLA STATE
========================================================= */

let qiblaBearing = 0;

let compassStarted = false;

let compassHandler = null;


/* =========================================================
   INITIALIZATION GUARD
========================================================= */

let prayerLocationQiblaInitialized = false;


/* =========================================================
   INITIALIZATION
========================================================= */

function initializePrayerLocationQibla() {

    if (prayerLocationQiblaInitialized) {

        return;

    }


    prayerLocationQiblaInitialized = true;


    console.log(
        "🕌 Prayer + Location + Qibla system starting..."
    );


    loadSavedPrayerLocation();

    setupLocationControls();

    setupQiblaButton();

    setupLocationPageDefaults();


    /*
       Saved location থাকলে
       সেটি ব্যবহার করবে।

       না থাকলে GPS ব্যবহার করবে।
    */

    if (
        prayerLocation.latitude !== null &&
        prayerLocation.longitude !== null
    ) {

        updateAllLocationDisplays();

        loadPrayerTimesForLocation(
            prayerLocation.latitude,
            prayerLocation.longitude
        );

    } else {

        useCurrentGPSLocation();

    }


    startPrayerCountdown();

    schedulePrayerMidnightRefresh();

    updatePrayerDateText();

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializePrayerLocationQibla
    );

} else {

    initializePrayerLocationQibla();

}


/* =========================================================
   LOAD SAVED LOCATION
========================================================= */

function loadSavedPrayerLocation() {

    try {

        const saved =
            localStorage.getItem(
                PRAYER_LOCATION_STORAGE_KEY
            );


        if (!saved) {

            return;

        }


        const data =
            JSON.parse(saved);


        if (!data) {

            return;

        }


        prayerLocation = {

            country:
                data.country || "",

            city:
                data.city || "",

            area:
                data.area || "",

            latitude:
                typeof data.latitude === "number"
                    ? data.latitude
                    : null,

            longitude:
                typeof data.longitude === "number"
                    ? data.longitude
                    : null,

            source:
                data.source || "saved"

        };


        console.log(
            "📍 Saved location loaded:",
            prayerLocation
        );


    } catch (error) {

        console.error(
            "Saved location load error:",
            error
        );

    }

}


/* =========================================================
   SAVE LOCATION
========================================================= */

function savePrayerLocation() {

    try {

        localStorage.setItem(
            PRAYER_LOCATION_STORAGE_KEY,
            JSON.stringify(prayerLocation)
        );


        console.log(
            "📍 Location saved:",
            prayerLocation
        );


    } catch (error) {

        console.error(
            "Location save error:",
            error
        );

    }

}


/* =========================================================
   LOCATION DISPLAY
========================================================= */

function getLocationDisplayName() {

    if (prayerLocation.area) {

        return prayerLocation.area;

    }


    if (prayerLocation.city) {

        return prayerLocation.city;

    }


    if (prayerLocation.country) {

        return prayerLocation.country;

    }


    return "লোকেশন নির্বাচন করুন";

}


/* =========================================================
   UPDATE ALL LOCATION TEXT
========================================================= */

function updateAllLocationDisplays() {

    const locationName =
        getLocationDisplayName();


    const currentLocation =
        document.getElementById(
            "currentLocation"
        );


    const prayerLocationText =
        document.getElementById(
            "prayerLocationText"
        );


    const qiblaLocationText =
        document.getElementById(
            "qiblaLocationText"
        );


    const selectedLocationName =
        document.getElementById(
            "selectedLocationName"
        );


    if (currentLocation) {

        currentLocation.textContent =
            locationName;

    }


    if (prayerLocationText) {

        prayerLocationText.textContent =
            locationName;

    }


    if (qiblaLocationText) {

        qiblaLocationText.textContent =
            locationName;

    }


    if (selectedLocationName) {

        selectedLocationName.textContent =
            locationName;

    }

}


/* =========================================================
   SETUP LOCATION CONTROLS
========================================================= */

function setupLocationControls() {

    const useCurrentLocationBtn =
        document.getElementById(
            "useCurrentLocationBtn"
        );


    const saveLocationBtn =
        document.getElementById(
            "saveLocationBtn"
        );


    const countrySelect =
        document.getElementById(
            "locationCountry"
        );


    const citySelect =
        document.getElementById(
            "locationCity"
        );


    /* -----------------------------------------------------
       COUNTRY
    ----------------------------------------------------- */

    if (countrySelect) {

        populateCountrySelect(
            countrySelect
        );


        countrySelect.addEventListener(
            "change",
            function() {

                const selectedCountry =
                    countrySelect.value;


                /*
                   নতুন দেশ নির্বাচন করলে
                   পুরোনো city/coordinates আর রাখা হবে না।
                */

                prayerLocation.country =
                    selectedCountry;


                prayerLocation.city = "";

                prayerLocation.area = "";

                prayerLocation.latitude = null;

                prayerLocation.longitude = null;

                prayerLocation.source = "manual";


                populateCitySelect(
                    selectedCountry
                );


                updateAllLocationDisplays();


                console.log(
                    "🌍 Country changed:",
                    selectedCountry
                );

            }
        );

    }


    /* -----------------------------------------------------
       GPS BUTTON
    ----------------------------------------------------- */

    if (useCurrentLocationBtn) {

        useCurrentLocationBtn.addEventListener(
            "click",
            useCurrentGPSLocation
        );

    }


    /* -----------------------------------------------------
       SAVE BUTTON
    ----------------------------------------------------- */

    if (saveLocationBtn) {

        saveLocationBtn.addEventListener(
            "click",
            saveManualLocation
        );

    }


    /* -----------------------------------------------------
       CITY
    ----------------------------------------------------- */

    if (citySelect) {

        citySelect.addEventListener(
            "change",
            function() {

                const selected =
                    citySelect.value;


                const countrySelect =
                    document.getElementById(
                        "locationCountry"
                    );


                if (
                    countrySelect &&
                    countrySelect.value
                ) {

                    prayerLocation.country =
                        countrySelect.value;

                }


                if (selected) {

                    prayerLocation.city =
                        selected;

                    prayerLocation.area =
                        selected;

                }


                updateAllLocationDisplays();


                console.log(
                    "🏙️ City changed:",
                    selected
                );

            }
        );

    }

}


/* =========================================================
   COUNTRY SELECT
========================================================= */

function populateCountrySelect(
    selectElement
) {

    if (!selectElement) {

        return;

    }


    selectElement.innerHTML =
        `<option value="">দেশ নির্বাচন করুন</option>`;


    Object.keys(
        LOCATION_DATA
    ).forEach(
        function(country) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                country;


            option.textContent =
                country;


            selectElement.appendChild(
                option
            );

        }
    );


    if (prayerLocation.country) {

        selectElement.value =
            prayerLocation.country;


        populateCitySelect(
            prayerLocation.country
        );

    }

}


/* =========================================================
   CITY SELECT
========================================================= */

function populateCitySelect(
    country
) {

    const citySelect =
        document.getElementById(
            "locationCity"
        );


    if (!citySelect) {

        return;

    }


    citySelect.innerHTML =
        `<option value="">শহর নির্বাচন করুন</option>`;


    const cities =
        LOCATION_DATA[country] || [];


    cities.forEach(
        function(city) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                city;


            option.textContent =
                city;


            citySelect.appendChild(
                option
            );

        }
    );


    if (
        prayerLocation.city &&
        cities.includes(
            prayerLocation.city
        )
    ) {

        citySelect.value =
            prayerLocation.city;

    }

}


/* =========================================================
   LOCATION PAGE DEFAULTS
========================================================= */

function setupLocationPageDefaults() {

    const countrySelect =
        document.getElementById(
            "locationCountry"
        );


    if (
        countrySelect &&
        prayerLocation.country
    ) {

        countrySelect.value =
            prayerLocation.country;


        populateCitySelect(
            prayerLocation.country
        );

    }


    updateAllLocationDisplays();

}


/* =========================================================
   LOCATION PAGE REFRESH
========================================================= */

function refreshLocationPage() {

    const countrySelect =
        document.getElementById(
            "locationCountry"
        );


    if (countrySelect) {

        countrySelect.value =
            prayerLocation.country || "";


        populateCitySelect(
            prayerLocation.country || ""
        );

    }


    updateAllLocationDisplays();


    console.log(
        "📍 Location page refreshed"
    );

}


/* =========================================================
   MANUAL LOCATION SAVE
========================================================= */

async function saveManualLocation() {

    const countrySelect =
        document.getElementById(
            "locationCountry"
        );


    const citySelect =
        document.getElementById(
            "locationCity"
        );


    if (!countrySelect || !citySelect) {

        return;

    }


    const country =
        countrySelect.value;


    const city =
        citySelect.value;


    if (!country || !city) {

        alert(
            "অনুগ্রহ করে দেশ ও শহর নির্বাচন করুন।"
        );

        return;

    }


    prayerLocation.country =
        country;


    prayerLocation.city =
        city;


    prayerLocation.area =
        city;


    const saveButton =
        document.getElementById(
            "saveLocationBtn"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "লোকেশন খোঁজা হচ্ছে...";

    }


    updateAllLocationDisplays();


    try {

        const query =
            encodeURIComponent(
                `${city}, ${country}`
            );


        const url =
            `https://nominatim.openstreetmap.org/search` +
            `?q=${query}` +
            `&format=json` +
            `&limit=1`;


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Geocoding failed"
            );

        }


        const results =
            await response.json();


        if (
            !results ||
            !results.length
        ) {

            throw new Error(
                "Location coordinates not found"
            );

        }


        prayerLocation.latitude =
            Number(
                results[0].lat
            );


        prayerLocation.longitude =
            Number(
                results[0].lon
            );


        prayerLocation.source =
            "manual";


        savePrayerLocation();

        updateAllLocationDisplays();


        await loadPrayerTimesForLocation(
            prayerLocation.latitude,
            prayerLocation.longitude
        );


        updateQiblaBearing();


        alert(
            "লোকেশন সফলভাবে সংরক্ষণ করা হয়েছে।"
        );


    } catch (error) {

        console.error(
            "Manual location error:",
            error
        );


        alert(
            "লোকেশন পাওয়া যায়নি। আবার চেষ্টা করুন।"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "লোকেশন সংরক্ষণ করুন";

        }

    }

}


/* =========================================================
   GPS LOCATION
========================================================= */

function useCurrentGPSLocation() {

    const locationText =
        document.getElementById(
            "currentLocation"
        );


    const selectedLocationName =
        document.getElementById(
            "selectedLocationName"
        );


    if (!navigator.geolocation) {

        if (locationText) {

            locationText.textContent =
                "GPS সাপোর্ট নেই";

        }


        if (selectedLocationName) {

            selectedLocationName.textContent =
                "GPS সাপোর্ট নেই";

        }


        return;

    }


    if (locationText) {

        locationText.textContent =
            "লোকেশন নেওয়া হচ্ছে...";

    }


    if (selectedLocationName) {

        selectedLocationName.textContent =
            "লোকেশন নেওয়া হচ্ছে...";

    }


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            prayerLocation.latitude =
                latitude;


            prayerLocation.longitude =
                longitude;


            prayerLocation.source =
                "gps";


            console.log(
                "📍 GPS:",
                latitude,
                longitude
            );


            await reverseGeocodeLocation(
                latitude,
                longitude
            );


            savePrayerLocation();

            updateAllLocationDisplays();


            await loadPrayerTimesForLocation(
                latitude,
                longitude
            );


            updateQiblaBearing();

        },


        function(error) {

            console.error(
                "GPS error:",
                error
            );


            if (locationText) {

                locationText.textContent =
                    "লোকেশন পাওয়া যায়নি";

            }


            if (selectedLocationName) {

                selectedLocationName.textContent =
                    "লোকেশন পাওয়া যায়নি";

            }

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
        }

    );

}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

async function reverseGeocodeLocation(
    latitude,
    longitude
) {

    try {

        const url =
            `https://api.bigdatacloud.net/data/reverse-geocode-client` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&localityLanguage=bn`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Reverse geocoding failed"
            );

        }


        const data =
            await response.json();


        const area =
            data.locality ||
            data.city ||
            data.localityInfo?.administrative?.[2]?.name ||
            "";


        const city =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            "";


        const country =
            data.countryName ||
            "";


        prayerLocation.area =
            area || city || "";


        prayerLocation.city =
            city;


        prayerLocation.country =
            country;


        console.log(
            "📍 Reverse geocode:",
            data
        );


    } catch (error) {

        console.error(
            "Reverse geocode error:",
            error
        );


        prayerLocation.area =
            "বর্তমান লোকেশন";

    }

}


/* =========================================================
   LOAD PRAYER TIMES
========================================================= */

async function loadPrayerTimesForLocation(
    latitude,
    longitude
) {

    if (
        latitude === null ||
        longitude === null ||
        Number.isNaN(Number(latitude)) ||
        Number.isNaN(Number(longitude))
    ) {

        return;

    }


    updateAllLocationDisplays();


    try {

        const now =
            new Date();


        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const year =
            now.getFullYear();


        const date =
            `${day}-${month}-${year}`;


        const url =
            `https://api.aladhan.com/v1/timings/${date}` +
            `?latitude=${encodeURIComponent(latitude)}` +
            `&longitude=${encodeURIComponent(longitude)}` +
            `&method=4` +
            `&school=0`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Prayer API response failed"
            );

        }


        const result =
            await response.json();


        if (
            !result.data ||
            !result.data.timings
        ) {

            throw new Error(
                "Prayer timings not found"
            );

        }


        currentPrayerTimings =
            result.data.timings;


        currentPrayerDate =
            result.data.date?.gregorian?.date ||
            date;


        currentPrayerTimezone =
            result.data.meta?.timezone ||
            "";


        /*
           Cache
        */

        try {

            localStorage.setItem(
                PRAYER_TIMINGS_STORAGE_KEY,
                JSON.stringify(
                    currentPrayerTimings
                )
            );


            localStorage.setItem(
                PRAYER_DATE_STORAGE_KEY,
                currentPrayerDate
            );

        } catch (cacheError) {

            console.warn(
                "Prayer cache error:",
                cacheError
            );

        }


        /*
           Update UI
        */

        updateHomePrayerTimes();

        updatePrayerPage();

        updateHijriDate(
            result.data.date?.hijri
        );

        updateNextPrayer();

        updateQiblaBearing();


        console.log(
            "✅ Prayer timings loaded:",
            currentPrayerTimings
        );


    } catch (error) {

        console.error(
            "Prayer API error:",
            error
        );


        loadPrayerTimesFromCache();

    }

}


/* =========================================================
   LOAD PRAYER CACHE
========================================================= */

function loadPrayerTimesFromCache() {

    try {

        const savedTimings =
            localStorage.getItem(
                PRAYER_TIMINGS_STORAGE_KEY
            );


        if (!savedTimings) {

            return;

        }


        currentPrayerTimings =
            JSON.parse(
                savedTimings
            );


        currentPrayerDate =
            localStorage.getItem(
                PRAYER_DATE_STORAGE_KEY
            ) || "";


        if (!currentPrayerTimings) {

            return;

        }


        updateHomePrayerTimes();

        updatePrayerPage();

        updateNextPrayer();


        console.log(
            "📦 Prayer timings loaded from cache"
        );


    } catch (error) {

        console.error(
            "Prayer cache load error:",
            error
        );

    }

}


/* =========================================================
   PRAYER TIME FORMAT
========================================================= */

function formatPrayerTime(time) {

    if (!time) {

        return "--:--";

    }


    return String(time)
        .split(" ")[0];

}


/* =========================================================
   HOME PRAYER CARD
========================================================= */

function updateHomePrayerTimes() {

    if (!currentPrayerTimings) {

        return;

    }


    const homeTimes = {

        fajrTime:
            currentPrayerTimings.Fajr,

        sunriseTime:
            currentPrayerTimings.Sunrise,

        dhuhrTime:
            currentPrayerTimings.Dhuhr,

        asrTime:
            currentPrayerTimings.Asr,

        maghribTime:
            currentPrayerTimings.Maghrib,

        ishaTime:
            currentPrayerTimings.Isha

    };


    Object.keys(
        homeTimes
    ).forEach(
        function(id) {

            const element =
                document.getElementById(id);


            if (element) {

                element.textContent =
                    formatPrayerTime(
                        homeTimes[id]
                    );

            }

        }
    );

}


/* =========================================================
   PRAYER PAGE
   CURRENT HTML:
   prayerRowFajr
   prayerRowSunrise
   prayerRowDhuhr
   prayerRowAsr
   prayerRowMaghrib
   prayerRowIsha
========================================================= */

function updatePrayerPage() {

    if (!currentPrayerTimings) {

        return;

    }


    const pageRows = {

        prayerRowFajr:
            currentPrayerTimings.Fajr,

        prayerRowSunrise:
            currentPrayerTimings.Sunrise,

        prayerRowDhuhr:
            currentPrayerTimings.Dhuhr,

        prayerRowAsr:
            currentPrayerTimings.Asr,

        prayerRowMaghrib:
            currentPrayerTimings.Maghrib,

        prayerRowIsha:
            currentPrayerTimings.Isha

    };


    Object.keys(
        pageRows
    ).forEach(
        function(rowId) {

            const row =
                document.getElementById(
                    rowId
                );


            if (!row) {

                return;

            }


            const formattedTime =
                formatPrayerTime(
                    pageRows[rowId]
                );


            /*
               Existing time element থাকলে
               সেটির text update করবে।
            */

            const timeElement =
                row.querySelector(
                    ".prayer-row-time"
                );


            if (timeElement) {

                timeElement.textContent =
                    formattedTime;

                return;

            }


            /*
               Existing time class না থাকলে
               data-time element খুঁজবে।
            */

            const dataTimeElement =
                row.querySelector(
                    "[data-prayer-time]"
                );


            if (dataTimeElement) {

                dataTimeElement.textContent =
                    formattedTime;

                return;

            }


            /*
               শেষ fallback:
               row-এর ভেতরে prayer-row-time
               element তৈরি করবে।
            */

            const newTimeElement =
                document.createElement(
                    "span"
                );


            newTimeElement.className =
                "prayer-row-time";


            newTimeElement.textContent =
                formattedTime;


            row.appendChild(
                newTimeElement
            );

        }
    );


    const prayerTodayDate =
        document.getElementById(
            "prayerTodayDate"
        );


    if (prayerTodayDate) {

        const now =
            new Date();


        prayerTodayDate.textContent =
            now.toLocaleDateString(
                "bn-BD",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    updateAllLocationDisplays();

}


/* =========================================================
   HIJRI DATE
========================================================= */

function updateHijriDate(
    hijriData
) {

    const element =
        document.getElementById(
            "prayerHijriDate"
        );


    if (!element) {

        return;

    }


    if (!hijriData) {

        element.textContent =
            "";

        return;

    }


    const day =
        hijriData.day || "";


    const month =
        hijriData.month?.en ||
        hijriData.month?.ar ||
        "";


    const year =
        hijriData.year || "";


    element.textContent =
        `${day} ${month} ${year} হিজরি`;

}


/* =========================================================
   NEXT PRAYER
========================================================= */

function getPrayerMinutes(time) {

    if (!time) {

        return null;

    }


    const clean =
        String(time)
            .split(" ")[0];


    const parts =
        clean.split(":");


    if (parts.length < 2) {

        return null;

    }


    const hours =
        Number(parts[0]);


    const minutes =
        Number(parts[1]);


    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {

        return null;

    }


    return (
        hours * 60 +
        minutes
    );

}


/* =========================================================
   UPDATE NEXT PRAYER
========================================================= */

function updateNextPrayer() {

    if (!currentPrayerTimings) {

        return;

    }


    const now =
        new Date();


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes() +
        (
            now.getSeconds() / 60
        );


    const prayers = [

        {
            name: "ফজর",
            time:
                currentPrayerTimings.Fajr
        },

        {
            name: "যোহর",
            time:
                currentPrayerTimings.Dhuhr
        },

        {
            name: "আসর",
            time:
                currentPrayerTimings.Asr
        },

        {
            name: "মাগরিব",
            time:
                currentPrayerTimings.Maghrib
        },

        {
            name: "এশা",
            time:
                currentPrayerTimings.Isha
        }

    ];


    let nextPrayer = null;

    let minutesRemaining = null;


    for (
        let i = 0;
        i < prayers.length;
        i++
    ) {

        const prayerMinutes =
            getPrayerMinutes(
                prayers[i].time
            );


        if (
            prayerMinutes !== null &&
            prayerMinutes > currentMinutes
        ) {

            nextPrayer =
                prayers[i];


            minutesRemaining =
                prayerMinutes -
                currentMinutes;


            break;

        }

    }


    /*
       এশার পর → পরের দিনের ফজর
    */

    if (!nextPrayer) {

        nextPrayer =
            prayers[0];


        const fajrMinutes =
            getPrayerMinutes(
                prayers[0].time
            );


        if (fajrMinutes !== null) {

            minutesRemaining =
                (
                    24 * 60 -
                    currentMinutes
                ) +
                fajrMinutes;

        }

    }


    const nextPrayerName =
        document.getElementById(
            "nextPrayerName"
        );


    const nextPrayerCountdown =
        document.getElementById(
            "nextPrayerCountdown"
        );


    if (nextPrayerName) {

        nextPrayerName.textContent =
            nextPrayer
                ? `পরবর্তী: ${nextPrayer.name}`
                : "পরবর্তী নামাজ";

    }


    if (
        nextPrayerCountdown &&
        minutesRemaining !== null
    ) {

        const totalSeconds =
            Math.max(
                0,
                Math.round(
                    minutesRemaining * 60
                )
            );


        const hours =
            Math.floor(
                totalSeconds / 3600
            );


        const minutes =
            Math.floor(
                (totalSeconds % 3600) /
                60
            );


        const seconds =
            totalSeconds % 60;


        nextPrayerCountdown.textContent =
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;

    }

}


/* =========================================================
   START COUNTDOWN
========================================================= */

function startPrayerCountdown() {

    if (prayerCountdownTimer) {

        clearInterval(
            prayerCountdownTimer
        );

    }


    updateNextPrayer();


    prayerCountdownTimer =
        setInterval(
            updateNextPrayer,
            1000
        );

}


/* =========================================================
   PRAYER DATE DISPLAY
========================================================= */

function updatePrayerDateText() {

    const prayerTodayDate =
        document.getElementById(
            "prayerTodayDate"
        );


    if (!prayerTodayDate) {

        return;

    }


    const now =
        new Date();


    prayerTodayDate.textContent =
        now.toLocaleDateString(
            "bn-BD",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}


/* =========================================================
   QIBLA BEARING CALCULATION
========================================================= */

function calculateQiblaBearing(
    latitude,
    longitude
) {

    const lat1 =
        Number(latitude) *
        Math.PI / 180;


    const lon1 =
        Number(longitude) *
        Math.PI / 180;


    const lat2 =
        KAABA_LATITUDE *
        Math.PI / 180;


    const lon2 =
        KAABA_LONGITUDE *
        Math.PI / 180;


    const deltaLon =
        lon2 - lon1;


    const y =
        Math.sin(deltaLon) *
        Math.cos(lat2);


    const x =
        Math.cos(lat1) *
        Math.sin(lat2) -
        Math.sin(lat1) *
        Math.cos(lat2) *
        Math.cos(deltaLon);


    let bearing =
        Math.atan2(
            y,
            x
        ) *
        180 /
        Math.PI;


    bearing =
        (bearing + 360) % 360;


    return bearing;

}


/* =========================================================
   UPDATE QIBLA BEARING
========================================================= */

function updateQiblaBearing() {

    if (
        prayerLocation.latitude === null ||
        prayerLocation.longitude === null
    ) {

        return;

    }


    qiblaBearing =
        calculateQiblaBearing(
            prayerLocation.latitude,
            prayerLocation.longitude
        );


    const degreeElement =
        document.getElementById(
            "qiblaDegree"
        );


    const arrow =
        document.getElementById(
            "qiblaArrow"
        );


    if (degreeElement) {

        degreeElement.textContent =
            `${Math.round(qiblaBearing)}°`;

    }


    /*
       Compass না চালু থাকলে
       Qibla bearing অনুযায়ী
       arrow-এর initial direction।
    */

    if (
        arrow &&
        !compassStarted
    ) {

        arrow.style.transform =
            `translate(-50%, -50%) rotate(${qiblaBearing}deg)`;

    }

}


/* =========================================================
   QIBLA BUTTON
========================================================= */

function setupQiblaButton() {

    const button =
        document.getElementById(
            "startQiblaBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function() {

            if (compassStarted) {

                stopQiblaCompass();

            } else {

                startQiblaCompass();

            }

        }
    );

}


/* =========================================================
   START QIBLA COMPASS
========================================================= */

async function startQiblaCompass() {

    const status =
        document.getElementById(
            "qiblaStatus"
        );


    const button =
        document.getElementById(
            "startQiblaBtn"
        );


    if (
        prayerLocation.latitude === null ||
        prayerLocation.longitude === null
    ) {

        if (status) {

            status.textContent =
                "আগে লোকেশন চালু করুন।";

        }


        return;

    }


    /*
       iPhone / iOS permission
    */

    try {

        if (
            typeof DeviceOrientationEvent !==
            "undefined" &&
            typeof DeviceOrientationEvent.requestPermission ===
            "function"
        ) {

            const permission =
                await DeviceOrientationEvent.requestPermission();


            if (
                permission !==
                "granted"
            ) {

                if (status) {

                    status.textContent =
                        "কম্পাস ব্যবহারের অনুমতি দেওয়া হয়নি।";

                }


                return;

            }

        }

    } catch (error) {

        console.error(
            "Compass permission error:",
            error
        );

    }


    if (
        !window.DeviceOrientationEvent
    ) {

        if (status) {

            status.textContent =
                "এই ডিভাইসে Compass সাপোর্ট নেই।";

        }


        return;

    }


    if (compassStarted) {

        return;

    }


    compassStarted = true;


    if (button) {

        button.textContent =
            "🧭 কম্পাস বন্ধ করুন";

    }


    if (status) {

        status.textContent =
            "ফোনটি ধীরে ধীরে ঘোরান...";

    }


    compassHandler =
        function(event) {

            let heading = null;


            /*
               iOS
            */

            if (
                typeof event.webkitCompassHeading ===
                "number"
            ) {

                heading =
                    event.webkitCompassHeading;

            }


            /*
               Android / Absolute orientation
            */

            else if (
                event.absolute &&
                typeof event.alpha ===
                "number"
            ) {

                heading =
                    360 - event.alpha;

            }


            /*
               কিছু Android device
            */

            else if (
                typeof event.alpha ===
                "number"
            ) {

                heading =
                    360 - event.alpha;

            }


            if (
                heading === null ||
                Number.isNaN(heading)
            ) {

                return;

            }


            heading =
                (heading + 360) % 360;


            /*
               Qibla direction relative
               to phone heading
            */

            const relativeAngle =
                (
                    qiblaBearing -
                    heading +
                    360
                ) % 360;


            const arrow =
                document.getElementById(
                    "qiblaArrow"
                );


            if (arrow) {

                arrow.style.transform =
                    `translate(-50%, -50%) rotate(${relativeAngle}deg)`;

            }


            const compassStatus =
                document.getElementById(
                    "qiblaStatus"
                );


            if (compassStatus) {

                compassStatus.textContent =
                    `কিবলা: ${Math.round(qiblaBearing)}° • ফোনের দিক: ${Math.round(heading)}°`;

            }

        };


    /*
       Android
    */

    window.addEventListener(
        "deviceorientationabsolute",
        compassHandler,
        true
    );


    /*
       Fallback
    */

    window.addEventListener(
        "deviceorientation",
        compassHandler,
        true
    );

}


/* =========================================================
   STOP COMPASS
========================================================= */

function stopQiblaCompass() {

    if (compassHandler) {

        window.removeEventListener(
            "deviceorientationabsolute",
            compassHandler,
            true
        );


        window.removeEventListener(
            "deviceorientation",
            compassHandler,
            true
        );

    }


    compassHandler = null;

    compassStarted = false;


    const button =
        document.getElementById(
            "startQiblaBtn"
        );


    const status =
        document.getElementById(
            "qiblaStatus"
        );


    if (button) {

        button.textContent =
            "🧭 কিবলা দেখান";

    }


    if (status) {

        status.textContent =
            "কম্পাস বন্ধ করা হয়েছে।";

    }


    updateQiblaBearing();

}


/* =========================================================
   MIDNIGHT REFRESH
========================================================= */

function schedulePrayerMidnightRefresh() {

    if (midnightRefreshTimer) {

        clearTimeout(
            midnightRefreshTimer
        );

    }


    const now =
        new Date();


    const tomorrow =
        new Date(now);


    tomorrow.setDate(
        now.getDate() + 1
    );


    tomorrow.setHours(
        0,
        5,
        0,
        0
    );


    const delay =
        tomorrow.getTime() -
        now.getTime();


    midnightRefreshTimer =
        setTimeout(
            function() {

                if (
                    prayerLocation.latitude !== null &&
                    prayerLocation.longitude !== null
                ) {

                    loadPrayerTimesForLocation(
                        prayerLocation.latitude,
                        prayerLocation.longitude
                    );

                }


                schedulePrayerMidnightRefresh();

            },
            Math.max(
                delay,
                1000
            )
        );

}


/* =========================================================
   PUBLIC HELPERS
========================================================= */

window.QuranSharifPrayer = {

    getLocation:
        function() {

            return prayerLocation;

        },


    refresh:
        function() {

            if (
                prayerLocation.latitude !== null &&
                prayerLocation.longitude !== null
            ) {

                return loadPrayerTimesForLocation(
                    prayerLocation.latitude,
                    prayerLocation.longitude
                );

            }

        },


    /*
       Location page refresh
    */

    refreshLocationPage:
        refreshLocationPage,


    /*
       GPS
    */

    useGPS:
        useCurrentGPSLocation,


    /*
       Qibla
    */

    startQibla:
        startQiblaCompass,


    stopQibla:
        stopQiblaCompass,


    /*
       Qibla bearing
    */

    getQiblaBearing:
        function() {

            return qiblaBearing;

        }

};


/* =========================================================
   END
========================================================= */