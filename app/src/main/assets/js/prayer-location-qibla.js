
/* =========================================================
   QURAN SHARIF
   PRAYER TIME + LOCATION + QIBLA
   Complete Updated Version
   Features:
   - GPS and manual location
   - Country/city selection
   - Prayer timings with 12-hour AM/PM format
   - Location-based countdown
   - Hijri date
   - Qibla bearing and compass
   - Location-specific offline cache
   - Request protection and error handling
========================================================= */

"use strict";

/* =========================================================
   1. STORAGE KEYS
========================================================= */

const PRAYER_LOCATION_STORAGE_KEY = "quranSharifLocation";
const PRAYER_TIMINGS_STORAGE_KEY = "quranSharifPrayerTimings";
const PRAYER_DATE_STORAGE_KEY = "quranSharifPrayerDate";

/* =========================================================
   2. KAABA LOCATION
========================================================= */

const KAABA_LATITUDE = 21.422487;
const KAABA_LONGITUDE = 39.826206;

/* =========================================================
   3. COUNTRY AND CITY DATA
========================================================= */

const LOCATION_DATA = {
    "সৌদি আরব": [
        "আল কাতিফ",
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
   4. LOCATION STATE
========================================================= */

let prayerLocation = {
    country: "",
    city: "",
    area: "",
    latitude: null,
    longitude: null,
    source: ""
};

let currentPrayerTimings = null;
let currentPrayerDate = "";
let currentPrayerTimezone = "";
let currentPrayerHijri = null;

/* =========================================================
   4A. SYNC PRAYER CALENDAR TO ANDROID NOTIFICATIONS
   Payload expected by PrayerNotificationBridge.kt:
   { timeZone: "Asia/Riyadh", days: [{ dateKey, fajr, dhuhr, asr, maghrib, isha }] }
========================================================= */

async function syncPrayerCalendarToAndroid(latitude, longitude, requestId) {
    const bridge = window.AndroidPrayerNotifications;

    if (!bridge || typeof bridge.savePrayerTimings !== "function") {
        console.warn("Android prayer notification bridge unavailable.");
        return false;
    }

    if (!hasValidCoordinates(latitude, longitude)) {
        console.warn("Prayer calendar sync skipped: invalid coordinates.");
        return false;
    }

    if (!currentPrayerTimezone) {
        console.warn("Prayer calendar sync skipped: timezone is unavailable.");
        return false;
    }

    try {
        const today = getCurrentDateForLocation();
        if (!today) {
            throw new Error("Could not determine the selected location's date.");
        }

        const dateMatch = today.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!dateMatch) {
            throw new Error("Invalid location date: " + today);
        }

        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const months = [
            { month, year },
            {
                month: month === 12 ? 1 : month + 1,
                year: month === 12 ? year + 1 : year
            }
        ];

        const daysByDate = new Map();
        const prayerKeys = [
            ["fajr", "Fajr"],
            ["dhuhr", "Dhuhr"],
            ["asr", "Asr"],
            ["maghrib", "Maghrib"],
            ["isha", "Isha"]
        ];

        function cleanTime(value) {
            const match = String(value || "").match(/^\s*(\d{1,2}):(\d{2})/);
            if (!match) return "";

            const hour = Number(match[1]);
            const minute = Number(match[2]);
            if (
                !Number.isInteger(hour) || !Number.isInteger(minute) ||
                hour < 0 || hour > 23 || minute < 0 || minute > 59
            ) {
                return "";
            }

            return String(hour).padStart(2, "0") + ":" +
                String(minute).padStart(2, "0");
        }

        for (const item of months) {
            // Do not continue fetching/sending an old location's calendar
            // if a newer prayer-time request has superseded this request.
            if (requestId != null && requestId !== prayerRequestNumber) {
                return false;
            }

            const url =
                "https://api.aladhan.com/v1/calendar" +
                "?latitude=" + encodeURIComponent(latitude) +
                "&longitude=" + encodeURIComponent(longitude) +
                "&method=4&school=0" +
                "&month=" + item.month +
                "&year=" + item.year;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Prayer calendar request failed: HTTP " + response.status);
            }

            const result = await response.json();
            if (result.code !== 200 || !Array.isArray(result.data)) {
                throw new Error("Invalid prayer calendar response.");
            }

            for (const entry of result.data) {
                const gregorian = entry.date && entry.date.gregorian;
                const timings = entry.timings;
                if (!gregorian || !gregorian.month || !timings) continue;

                const entryYear = String(gregorian.year || item.year);
                const entryMonth = String(
                    gregorian.month.number || item.month
                ).padStart(2, "0");
                const entryDay = String(gregorian.day || "").padStart(2, "0");
                if (!/^\d{4}$/.test(entryYear) || !/^\d{2}$/.test(entryMonth) || !/^\d{2}$/.test(entryDay)) {
                    continue;
                }

                const dateKey = entryYear + "-" + entryMonth + "-" + entryDay;
                const day = { dateKey };
                for (const [key, apiKey] of prayerKeys) {
                    day[key] = cleanTime(timings[apiKey]);
                }

                if (prayerKeys.every(([key]) => day[key])) {
                    daysByDate.set(dateKey, day);
                }
            }
        }

        if (requestId != null && requestId !== prayerRequestNumber) {
            return false;
        }

        const days = Array.from(daysByDate.values())
            .filter(day => day.dateKey >= today)
            .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

        if (!days.length) {
            throw new Error("No valid future prayer timings were returned.");
        }

        const payload = {
            timeZone: currentPrayerTimezone,
            days
        };

        bridge.savePrayerTimings(JSON.stringify(payload));
        console.log("Prayer calendar synced to Android:", days.length, "days", currentPrayerTimezone);
        return true;
    } catch (error) {
        console.error("Could not sync prayer calendar to Android:", error);
        return false;
    }
}


let prayerCountdownTimer = null;
let midnightRefreshTimer = null;

let prayerLocationQiblaInitialized = false;
let prayerRequestNumber = 0;
let locationRequestNumber = 0;

/* =========================================================
   5. QIBLA STATE
========================================================= */

let qiblaBearing = 0;
let compassStarted = false;
let compassHandler = null;

/* =========================================================
   6. HELPERS
========================================================= */

function hasValidCoordinates(latitude, longitude) {
    if (
        latitude === null ||
        longitude === null ||
        latitude === "" ||
        longitude === ""
    ) {
        return false;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lon) <= 180
    );
}

function getCoordinatesCacheKey(latitude, longitude) {
    if (!hasValidCoordinates(latitude, longitude)) {
        return "";
    }

    return (
        Number(latitude).toFixed(4) +
        "," +
        Number(longitude).toFixed(4)
    );
}

function getLocationCacheKey() {
    return getCoordinatesCacheKey(
        prayerLocation.latitude,
        prayerLocation.longitude
    );
}

function setElementText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

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

function isValidPrayerTime(time) {
    return getPrayerMinutes(time) !== null;
}

/* =========================================================
   7. INITIALIZATION
========================================================= */

function initializePrayerLocationQibla() {
    if (prayerLocationQiblaInitialized) {
        return;
    }

    prayerLocationQiblaInitialized = true;

    console.log("Prayer + Location + Qibla starting...");

    loadSavedPrayerLocation();

    setupLocationControls();
    setupQiblaButton();
    setupLocationPageDefaults();
    setupClickableLocation();

    updateAllLocationDisplays();
    updatePrayerDateText();
    updateQiblaBearing();

    if (
        hasValidCoordinates(
            prayerLocation.latitude,
            prayerLocation.longitude
        )
    ) {
        loadPrayerTimesFromCache();

        loadPrayerTimesForLocation(
            prayerLocation.latitude,
            prayerLocation.longitude
        );
    } else {
        useCurrentGPSLocation();
    }

    startPrayerCountdown();
    schedulePrayerMidnightRefresh();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializePrayerLocationQibla,
        { once: true }
    );
} else {
    initializePrayerLocationQibla();
}

/* =========================================================
   8. LOAD SAVED LOCATION
========================================================= */

function loadSavedPrayerLocation() {
    try {
        const saved = localStorage.getItem(
            PRAYER_LOCATION_STORAGE_KEY
        );

        if (!saved) {
            return;
        }

        const data = JSON.parse(saved);

        if (!data || typeof data !== "object") {
            return;
        }

        const coordinatesValid = hasValidCoordinates(
            data.latitude,
            data.longitude
        );

        prayerLocation = {
            country: data.country || "",
            city: data.city || "",
            area: data.area || "",

            latitude: coordinatesValid
                ? Number(data.latitude)
                : null,

            longitude: coordinatesValid
                ? Number(data.longitude)
                : null,

            source: data.source || "saved"
        };

        console.log("Saved location loaded.");
    } catch (error) {
        console.error("Saved location error:", error);
    }
}

/* =========================================================
   9. SAVE LOCATION
========================================================= */

function savePrayerLocation() {
    try {
        localStorage.setItem(
            PRAYER_LOCATION_STORAGE_KEY,
            JSON.stringify(prayerLocation)
        );

        return true;
    } catch (error) {
        console.error("Location save error:", error);
        return false;
    }
}

/* =========================================================
   10. UPDATE LOCATION LABELS
========================================================= */

function updateAllLocationDisplays() {
    const name = getLocationDisplayName();

    setElementText("currentLocation", name);
    setElementText("prayerLocationText", name);
    setElementText("qiblaLocationText", name);
    setElementText("selectedLocationName", name);
}

/* =========================================================
   11. CLICKABLE HOME LOCATION
========================================================= */

function setupClickableLocation() {
    const locationElement = document.getElementById(
        "currentLocation"
    );

    if (!locationElement) {
        return;
    }

    locationElement.style.cursor = "pointer";
    locationElement.setAttribute("role", "button");
    locationElement.setAttribute("tabindex", "0");
    locationElement.setAttribute(
        "aria-label",
        "লোকেশন পরিবর্তন করুন"
    );

    if (
        locationElement.dataset.locationClickReady === "true"
    ) {
        return;
    }

    locationElement.dataset.locationClickReady = "true";

    function openLocationPage() {
        if (typeof window.showPage === "function") {
            window.showPage("locationPage");
        }

        refreshLocationPage();
    }

    locationElement.addEventListener(
        "click",
        openLocationPage
    );

    locationElement.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLocationPage();
        }
    });
}

/* =========================================================
   12. LOCATION CONTROLS
========================================================= */

function setupLocationControls() {
    const countrySelect = document.getElementById(
        "locationCountry"
    );

    const citySelect = document.getElementById(
        "locationCity"
    );

    const gpsButton = document.getElementById(
        "useCurrentLocationBtn"
    );

    const saveButton = document.getElementById(
        "saveLocationBtn"
    );

    if (countrySelect) {
        populateCountrySelect(countrySelect);

        if (countrySelect.dataset.prayerReady !== "true") {
            countrySelect.dataset.prayerReady = "true";

            countrySelect.addEventListener(
                "change",
                function () {
                    prayerLocation.country = countrySelect.value;
                    prayerLocation.city = "";
                    prayerLocation.area = "";
                    prayerLocation.source = "manual";

                    populateCitySelect(countrySelect.value);
                    updateAllLocationDisplays();
                }
            );
        }
    }

    if (
        citySelect &&
        citySelect.dataset.prayerReady !== "true"
    ) {
        citySelect.dataset.prayerReady = "true";

        citySelect.addEventListener("change", function () {
            prayerLocation.city = citySelect.value;
            prayerLocation.area = citySelect.value;
            prayerLocation.source = "manual";

            updateAllLocationDisplays();
        });
    }

    if (
        gpsButton &&
        gpsButton.dataset.prayerReady !== "true"
    ) {
        gpsButton.dataset.prayerReady = "true";

        gpsButton.addEventListener(
            "click",
            useCurrentGPSLocation
        );
    }

    if (
        saveButton &&
        saveButton.dataset.prayerReady !== "true"
    ) {
        saveButton.dataset.prayerReady = "true";

        saveButton.addEventListener(
            "click",
            saveManualLocation
        );
    }
}

/* =========================================================
   13. POPULATE COUNTRY SELECT
========================================================= */

function populateCountrySelect(selectElement) {
    if (!selectElement) {
        return;
    }

    selectElement.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "দেশ নির্বাচন করুন";

    selectElement.appendChild(placeholder);

    Object.keys(LOCATION_DATA).forEach(function (country) {
        const option = document.createElement("option");

        option.value = country;
        option.textContent = country;

        selectElement.appendChild(option);
    });

    if (prayerLocation.country) {
        selectElement.value = prayerLocation.country;

        populateCitySelect(prayerLocation.country);
    }
}

/* =========================================================
   14. POPULATE CITY SELECT
========================================================= */

function populateCitySelect(country) {
    const citySelect = document.getElementById("locationCity");

    if (!citySelect) {
        return;
    }

    citySelect.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "শহর নির্বাচন করুন";

    citySelect.appendChild(placeholder);

    const cities = LOCATION_DATA[country] || [];

    cities.forEach(function (city) {
        const option = document.createElement("option");

        option.value = city;
        option.textContent = city;

        citySelect.appendChild(option);
    });

    if (prayerLocation.city && cities.includes(prayerLocation.city)) {
        citySelect.value = prayerLocation.city;
    }
}

/* =========================================================
   15. LOCATION PAGE REFRESH
========================================================= */

function setupLocationPageDefaults() {
    const countrySelect = document.getElementById(
        "locationCountry"
    );

    if (countrySelect && prayerLocation.country) {
        countrySelect.value = prayerLocation.country;

        populateCitySelect(prayerLocation.country);
    }

    const citySelect = document.getElementById("locationCity");

    if (citySelect && prayerLocation.city) {
        citySelect.value = prayerLocation.city;
    }

    updateAllLocationDisplays();
}

function refreshLocationPage() {
    setupLocationPageDefaults();

    console.log("Location page refreshed.");
}

/* =========================================================
   16. MANUAL LOCATION SAVE
========================================================= */

async function saveManualLocation() {
    const countrySelect = document.getElementById(
        "locationCountry"
    );

    const citySelect = document.getElementById(
        "locationCity"
    );

    const saveButton = document.getElementById(
        "saveLocationBtn"
    );

    if (!countrySelect || !citySelect) {
        showPrayerAlert("লোকেশন নির্বাচন করার ফর্ম পাওয়া যায়নি।");
        return;
    }

    const country = countrySelect.value;
    const city = citySelect.value;

    if (!country || !city) {
        showPrayerAlert("অনুগ্রহ করে দেশ ও শহর নির্বাচন করুন।");
        return;
    }

    const requestId = ++locationRequestNumber;
    const previousLocation = { ...prayerLocation };

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "লোকেশন খোঁজা হচ্ছে...";
    }

    try {
        const query = encodeURIComponent(
            city + ", " + country
        );

        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?q=" + query +
            "&format=jsonv2&limit=1";

        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Location search failed.");
        }

        const results = await response.json();

        if (
            !Array.isArray(results) ||
            results.length === 0
        ) {
            throw new Error("Location coordinates not found.");
        }

        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);

        if (!hasValidCoordinates(latitude, longitude)) {
            throw new Error("Invalid coordinates.");
        }

        if (requestId !== locationRequestNumber) {
            return;
        }

        prayerLocation = {
            country: country,
            city: city,
            area: city,
            latitude: latitude,
            longitude: longitude,
            source: "manual"
        };

        savePrayerLocation();

        updateAllLocationDisplays();
        updateQiblaBearing();

        /*
         * Load timings for the newly selected location.
         * API errors are handled inside the loading function.
         */
        await loadPrayerTimesForLocation(
            latitude,
            longitude
        );

        if (requestId === locationRequestNumber) {
            showPrayerAlert("লোকেশন সংরক্ষণ করা হয়েছে।");
        }
    } catch (error) {
        console.error("Manual location error:", error);

        if (requestId === locationRequestNumber) {
            prayerLocation = previousLocation;

            updateAllLocationDisplays();
            setupLocationPageDefaults();
            updateQiblaBearing();

            showPrayerAlert(
                "লোকেশন পাওয়া যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
            );
        }
    } finally {
        if (saveButton && requestId === locationRequestNumber) {
            saveButton.disabled = false;
            saveButton.textContent = "লোকেশন সংরক্ষণ করুন";
        }
    }
}

/* =========================================================
   17. GPS LOCATION
========================================================= */

function useCurrentGPSLocation() {
    const locationText = document.getElementById(
        "currentLocation"
    );

    const selectedName = document.getElementById(
        "selectedLocationName"
    );

    if (!navigator.geolocation) {
        if (locationText) {
            locationText.textContent = "GPS সাপোর্ট নেই";
        }

        if (selectedName) {
            selectedName.textContent = "GPS সাপোর্ট নেই";
        }

        showPrayerAlert("এই ডিভাইসে GPS লোকেশন সুবিধা পাওয়া যাচ্ছে না।");
        return;
    }

    const requestId = ++locationRequestNumber;

    if (locationText) {
        locationText.textContent = "লোকেশন নেওয়া হচ্ছে...";
    }

    if (selectedName) {
        selectedName.textContent = "লোকেশন নেওয়া হচ্ছে...";
    }

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            if (requestId !== locationRequestNumber) {
                return;
            }

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            if (!hasValidCoordinates(latitude, longitude)) {
                showPrayerAlert("GPS থেকে সঠিক লোকেশন পাওয়া যায়নি।");
                updateAllLocationDisplays();
                return;
            }

            const previousLocation = { ...prayerLocation };

            prayerLocation.latitude = latitude;
            prayerLocation.longitude = longitude;
            prayerLocation.source = "gps";

            await reverseGeocodeLocation(latitude, longitude);

            if (requestId !== locationRequestNumber) {
                return;
            }

            savePrayerLocation();

            updateAllLocationDisplays();
            setupLocationPageDefaults();
            updateQiblaBearing();

            await loadPrayerTimesForLocation(
                latitude,
                longitude
            );

            console.log("GPS location updated.");
        },

        function (error) {
            if (requestId !== locationRequestNumber) {
                return;
            }

            console.error("GPS error:", error);

            updateAllLocationDisplays();

            let message = "লোকেশন পাওয়া যায়নি।";

            if (error.code === 1) {
                message =
                    "লোকেশন ব্যবহারের অনুমতি দেওয়া হয়নি। সেটিংস থেকে অনুমতি দিন অথবা শহর নির্বাচন করুন।";
            } else if (error.code === 2) {
                message =
                    "বর্তমান লোকেশন নির্ধারণ করা যাচ্ছে না। GPS চালু করে আবার চেষ্টা করুন।";
            } else if (error.code === 3) {
                message =
                    "GPS-এর উত্তর পেতে সময় বেশি লাগছে। আবার চেষ্টা করুন।";
            }

            showPrayerAlert(message);
        },

        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 300000
        }
    );
}

/* =========================================================
   18. REVERSE GEOCODING
========================================================= */

async function reverseGeocodeLocation(latitude, longitude) {
    try {
        const url =
            "https://api.bigdatacloud.net/data/reverse-geocode-client" +
            "?latitude=" + encodeURIComponent(latitude) +
            "&longitude=" + encodeURIComponent(longitude) +
            "&localityLanguage=bn";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Reverse geocoding failed.");
        }

        const data = await response.json();

        prayerLocation.area =
            data.locality ||
            data.city ||
            data.localityInfo?.administrative?.[2]?.name ||
            "";

        prayerLocation.city =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            "";

        prayerLocation.country = data.countryName || "";

        if (!prayerLocation.area) {
            prayerLocation.area =
                prayerLocation.city || "বর্তমান লোকেশন";
        }
    } catch (error) {
        console.error("Reverse geocoding error:", error);

        prayerLocation.area =
            prayerLocation.city || "বর্তমান লোকেশন";
    }
}

/* =========================================================
   19. LOAD PRAYER TIMES
========================================================= */

async function loadPrayerTimesForLocation(latitude, longitude) {
    if (!hasValidCoordinates(latitude, longitude)) {
        return false;
    }

    const requestId = ++prayerRequestNumber;

    const cacheKey = getCoordinatesCacheKey(
        latitude,
        longitude
    );

    updateAllLocationDisplays();

    /*
     * If the user changes location, immediately try to show
     * the cache for that exact location only.
     */
    loadPrayerTimesFromCacheForKey(cacheKey);

    try {
        const url =
            "https://api.aladhan.com/v1/timings" +
            "?latitude=" + encodeURIComponent(latitude) +
            "&longitude=" + encodeURIComponent(longitude) +
            "&method=4&school=0";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Prayer API request failed.");
        }

        const result = await response.json();

        if (requestId !== prayerRequestNumber) {
            return false;
        }

        if (
            result.code !== 200 ||
            !result.data ||
            !result.data.timings
        ) {
            throw new Error("Invalid prayer API response.");
        }

        const timings = result.data.timings;

        const requiredTimes = [
            "Fajr",
            "Sunrise",
            "Dhuhr",
            "Asr",
            "Maghrib",
            "Isha"
        ];

        for (const key of requiredTimes) {
            if (!isValidPrayerTime(timings[key])) {
                throw new Error("Invalid prayer time: " + key);
            }
        }

        currentPrayerTimings = timings;

        currentPrayerTimezone =
            result.data.meta?.timezone || "";

        const gregorianDate = result.data.date?.gregorian;
        currentPrayerDate = gregorianDate && gregorianDate.year && gregorianDate.month?.number && gregorianDate.day
            ? String(gregorianDate.year) + "-" +
                String(gregorianDate.month.number).padStart(2, "0") + "-" +
                String(gregorianDate.day).padStart(2, "0")
            : getCurrentDateForLocation();

        currentPrayerHijri =
            result.data.date?.hijri || null;

        // Sync today's and next month's prayer calendar to Android alarms.
        await syncPrayerCalendarToAndroid(latitude, longitude, requestId);

        // A newer location request may have started while calendar data loaded.
        if (requestId !== prayerRequestNumber) {
            return false;
        }

        const cacheObject = {
            locationKey: cacheKey,
            date: currentPrayerDate,
            timezone: currentPrayerTimezone,
            timings: currentPrayerTimings,
            hijri: currentPrayerHijri,
            savedAt: Date.now()
        };

        try {
            localStorage.setItem(
                PRAYER_TIMINGS_STORAGE_KEY,
                JSON.stringify(cacheObject)
            );

            localStorage.setItem(
                PRAYER_DATE_STORAGE_KEY,
                currentPrayerDate
            );
        } catch (cacheError) {
            console.warn("Prayer cache save error:", cacheError);
        }

        updateHomePrayerTimes();
        updatePrayerPage();
        updateHijriDate(currentPrayerHijri);
        updateNextPrayer();
        updateQiblaBearing();
        updatePrayerDateText();

        console.log(
            "Prayer timings loaded:",
            currentPrayerTimezone,
            currentPrayerTimings
        );

        return true;
    } catch (error) {
        if (requestId !== prayerRequestNumber) {
            return false;
        }

        console.error("Prayer API error:", error);

        const cached = loadPrayerTimesFromCacheForKey(cacheKey);

        if (!cached) {
            clearPrayerTimeDisplays();
        }

        return false;
    }
}

/* =========================================================
   20. LOAD PRAYER TIMES FROM CACHE
========================================================= */

function loadPrayerTimesFromCache() {
    const activeLocationKey = getLocationCacheKey();

    if (!activeLocationKey) {
        return false;
    }

    return loadPrayerTimesFromCacheForKey(activeLocationKey);
}

function loadPrayerTimesFromCacheForKey(activeLocationKey) {
    try {
        const saved = localStorage.getItem(
            PRAYER_TIMINGS_STORAGE_KEY
        );

        if (!saved || !activeLocationKey) {
            return false;
        }

        const data = JSON.parse(saved);

        if (
            !data ||
            !data.timings ||
            data.locationKey !== activeLocationKey
        ) {
            console.warn(
                "Prayer cache belongs to another location."
            );

            return false;
        }

        const requiredTimes = [
            "Fajr",
            "Sunrise",
            "Dhuhr",
            "Asr",
            "Maghrib",
            "Isha"
        ];

        for (const key of requiredTimes) {
            if (!isValidPrayerTime(data.timings[key])) {
                return false;
            }
        }

        currentPrayerTimings = data.timings;
        currentPrayerDate = data.date || "";
        currentPrayerTimezone = data.timezone || "";
        currentPrayerHijri = data.hijri || null;
         

        updateHomePrayerTimes();
        updatePrayerPage();
        updateNextPrayer();
        updatePrayerDateText();

        if (currentPrayerHijri) {
            updateHijriDate(currentPrayerHijri);
        }

        console.log("Prayer timings loaded from cache.");

        return true;
    } catch (error) {
        console.error("Prayer cache read error:", error);
        return false;
    }
}

/* =========================================================
   21. CLEAR PRAYER TIME DISPLAYS
========================================================= */

function clearPrayerTimeDisplays() {
    const ids = [
        "fajrTime",
        "sunriseTime",
        "dhuhrTime",
        "asrTime",
        "maghribTime",
        "ishaTime",
        "pageFajrTime",
        "pageSunriseTime",
        "pageDhuhrTime",
        "pageAsrTime",
        "pageMaghribTime",
        "pageIshaTime"
    ];

    ids.forEach(function (id) {
        setElementText(id, "--:--");
    });

    setElementText("nextPrayerName", "পরবর্তী নামাজ");
    setElementText("nextPrayerCountdown", "--:--:--");
}

/* =========================================================
   22. PRAYER TIME FORMAT
   24-HOUR API TIME -> 12-HOUR AM/PM
========================================================= */

function formatPrayerTime(time) {
    if (!time) {
        return "--:--";
    }

    const match = String(time).match(/(\d{1,2}):(\d{2})/);

    if (!match) {
        return "--:--";
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return "--:--";
    }

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
        hours = 12;
    }

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        " " +
        period
    );
}

/* =========================================================
   23. UPDATE HOME PRAYER TIMES
========================================================= */

function updateHomePrayerTimes() {
    if (!currentPrayerTimings) {
        return;
    }

    const map = {
        fajrTime: currentPrayerTimings.Fajr,
        sunriseTime: currentPrayerTimings.Sunrise,
        dhuhrTime: currentPrayerTimings.Dhuhr,
        asrTime: currentPrayerTimings.Asr,
        maghribTime: currentPrayerTimings.Maghrib,
        ishaTime: currentPrayerTimings.Isha
    };

    Object.keys(map).forEach(function (id) {
        setElementText(id, formatPrayerTime(map[id]));
    });
}

/* =========================================================
   24. UPDATE PRAYER DETAILS PAGE
========================================================= */

function updatePrayerPage() {
    if (!currentPrayerTimings) {
        return;
    }

    const pageTimes = {
        pageFajrTime: currentPrayerTimings.Fajr,
        pageSunriseTime: currentPrayerTimings.Sunrise,
        pageDhuhrTime: currentPrayerTimings.Dhuhr,
        pageAsrTime: currentPrayerTimings.Asr,
        pageMaghribTime: currentPrayerTimings.Maghrib,
        pageIshaTime: currentPrayerTimings.Isha
    };

    Object.keys(pageTimes).forEach(function (id) {
        setElementText(id, formatPrayerTime(pageTimes[id]));
    });

    updatePrayerDateText();
    updateAllLocationDisplays();
}

/* =========================================================
   25. HIJRI DATE
========================================================= */

function updateHijriDate(hijriData) {
    const element = document.getElementById("prayerHijriDate");

    if (!element) {
        return;
    }

    if (!hijriData) {
        element.textContent = "";
        return;
    }

    const day = hijriData.day || "";

    const month =
        hijriData.month?.en ||
        hijriData.month?.ar ||
        "";

    const year = hijriData.year || "";

    element.textContent =
        day + " " + month + " " + year + " হিজরি";
}

/* =========================================================
   26. LOCATION CLOCK
========================================================= */

function getLocationClockMinutes() {
    try {
        const options = {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
        };

        if (currentPrayerTimezone) {
            options.timeZone = currentPrayerTimezone;
        }

        const parts = new Intl.DateTimeFormat(
            "en-GB",
            options
        ).formatToParts(new Date());

        let hours = 0;
        let minutes = 0;

        parts.forEach(function (part) {
            if (part.type === "hour") {
                hours = Number(part.value);
            }

            if (part.type === "minute") {
                minutes = Number(part.value);
            }
        });

        return hours * 60 + minutes;
    } catch (error) {
        console.warn("Location clock error:", error);

        const now = new Date();

        return now.getHours() * 60 + now.getMinutes();
    }
}

/* =========================================================
   27. PRAYER TIME -> MINUTES
========================================================= */

function getPrayerMinutes(time) {
    if (!time) {
        return null;
    }

    const match = String(time).match(/(\d{1,2}):(\d{2})/);

    if (!match) {
        return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;
}

/* =========================================================
   28. NEXT PRAYER + COUNTDOWN
========================================================= */

function updateNextPrayer() {
    if (!currentPrayerTimings) {
        return;
    }

    const currentMinutes = getLocationClockMinutes();

    const prayers = [
        {
            name: "ফজর",
            time: currentPrayerTimings.Fajr
        },
        {
            name: "যোহর",
            time: currentPrayerTimings.Dhuhr
        },
        {
            name: "আসর",
            time: currentPrayerTimings.Asr
        },
        {
            name: "মাগরিব",
            time: currentPrayerTimings.Maghrib
        },
        {
            name: "এশা",
            time: currentPrayerTimings.Isha
        }
    ];

    let nextPrayer = null;
    let minutesRemaining = null;

    for (const prayer of prayers) {
        const prayerMinutes = getPrayerMinutes(prayer.time);

        if (
            prayerMinutes !== null &&
            prayerMinutes > currentMinutes
        ) {
            nextPrayer = prayer;
            minutesRemaining = prayerMinutes - currentMinutes;
            break;
        }
    }

    /*
     * If Isha has passed, the next prayer is tomorrow's Fajr.
     */
    if (!nextPrayer) {
        nextPrayer = prayers[0];

        const fajrMinutes = getPrayerMinutes(
            prayers[0].time
        );

        if (fajrMinutes !== null) {
            minutesRemaining =
                (24 * 60 - currentMinutes) + fajrMinutes;
        }
    }

    const nameElement = document.getElementById(
        "nextPrayerName"
    );

    const countdownElement = document.getElementById(
        "nextPrayerCountdown"
    );

    if (nameElement) {
        nameElement.textContent = nextPrayer
            ? "পরবর্তী: " + nextPrayer.name
            : "পরবর্তী নামাজ";
    }

    if (
        countdownElement &&
        minutesRemaining !== null
    ) {
        const totalSeconds = Math.max(
            0,
            Math.floor(minutesRemaining * 60) -
                (new Date().getSeconds())
        );

        const hours = Math.floor(totalSeconds / 3600);

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = totalSeconds % 60;

        countdownElement.textContent =
            String(hours).padStart(2, "0") + ":" +
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0");
    }
}

/* =========================================================
   29. START COUNTDOWN
========================================================= */

function startPrayerCountdown() {
    if (prayerCountdownTimer) {
        clearInterval(prayerCountdownTimer);
    }

    updateNextPrayer();

    prayerCountdownTimer = setInterval(
        updateNextPrayer,
        1000
    );
}

/* =========================================================
   30. DATE DISPLAY
========================================================= */

function updatePrayerDateText() {
    const element = document.getElementById(
        "prayerTodayDate"
    );

    if (!element) {
        return;
    }

    try {
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };

        if (currentPrayerTimezone) {
            options.timeZone = currentPrayerTimezone;
        }

        element.textContent = new Intl.DateTimeFormat(
            "bn-BD",
            options
        ).format(new Date());
    } catch (error) {
        element.textContent = new Date().toLocaleDateString(
            "bn-BD",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
    }
}

/* =========================================================
   31. QIBLA BEARING CALCULATION
========================================================= */

function calculateQiblaBearing(latitude, longitude) {
    const lat1 = Number(latitude) * Math.PI / 180;
    const lon1 = Number(longitude) * Math.PI / 180;

    const lat2 = KAABA_LATITUDE * Math.PI / 180;
    const lon2 = KAABA_LONGITUDE * Math.PI / 180;

    const deltaLon = lon2 - lon1;

    const y = Math.sin(deltaLon) * Math.cos(lat2);

    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) *
        Math.cos(deltaLon);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;

    bearing = (bearing + 360) % 360;

    return bearing;
}

/* =========================================================
   32. UPDATE QIBLA
========================================================= */

function updateQiblaBearing() {
    if (
        !hasValidCoordinates(
            prayerLocation.latitude,
            prayerLocation.longitude
        )
    ) {
        return;
    }

    qiblaBearing = calculateQiblaBearing(
        prayerLocation.latitude,
        prayerLocation.longitude
    );

    const degreeElement = document.getElementById(
        "qiblaDegree"
    );

    const arrow = document.getElementById("qiblaArrow");

    if (degreeElement) {
        degreeElement.textContent =
            Math.round(qiblaBearing) + "°";
    }

    if (arrow && !compassStarted) {
        arrow.style.transform =
            "translate(-50%, -50%) rotate(" +
            qiblaBearing +
            "deg)";
    }
}

/* =========================================================
   33. QIBLA BUTTON
========================================================= */

function setupQiblaButton() {
    const button = document.getElementById("startQiblaBtn");

    if (
        !button ||
        button.dataset.prayerReady === "true"
    ) {
        return;
    }

    button.dataset.prayerReady = "true";

    button.addEventListener("click", function () {
        if (compassStarted) {
            stopQiblaCompass();
        } else {
            startQiblaCompass();
        }
    });
}

/* =========================================================
   34. START COMPASS
========================================================= */

async function startQiblaCompass() {
    const status = document.getElementById("qiblaStatus");
    const button = document.getElementById("startQiblaBtn");

    if (
        !hasValidCoordinates(
            prayerLocation.latitude,
            prayerLocation.longitude
        )
    ) {
        if (status) {
            status.textContent = "আগে লোকেশন নির্বাচন করুন।";
        }

        return;
    }

    if (!window.DeviceOrientationEvent) {
        if (status) {
            status.textContent =
                "এই ডিভাইসে কম্পাস সাপোর্ট নেই।";
        }

        return;
    }

    /*
     * Some platforms require motion permission.
     */
    try {
        if (
            typeof DeviceOrientationEvent.requestPermission ===
            "function"
        ) {
            const permission =
                await DeviceOrientationEvent.requestPermission();

            if (permission !== "granted") {
                if (status) {
                    status.textContent =
                        "কম্পাস ব্যবহারের অনুমতি দেওয়া হয়নি।";
                }

                return;
            }
        }
    } catch (error) {
        console.warn("Compass permission:", error);

        if (status) {
            status.textContent =
                "কম্পাসের অনুমতি নেওয়া যায়নি।";
        }

        return;
    }

    if (compassStarted) {
        return;
    }

    compassStarted = true;

    if (button) {
        button.textContent = "🧭 কম্পাস বন্ধ করুন";
    }

    if (status) {
        status.textContent = "ফোনটি ধীরে ধীরে ঘোরান...";
    }

    compassHandler = function (event) {
        let heading = null;

        if (
            typeof event.webkitCompassHeading === "number"
        ) {
            heading = event.webkitCompassHeading;
        } else if (typeof event.alpha === "number") {
            heading = 360 - event.alpha;
        }

        if (
            heading === null ||
            !Number.isFinite(heading)
        ) {
            return;
        }

        heading = (heading + 360) % 360;

        const relativeAngle =
            (qiblaBearing - heading + 360) % 360;

        const arrow = document.getElementById("qiblaArrow");

        if (arrow) {
            arrow.style.transform =
                "translate(-50%, -50%) rotate(" +
                relativeAngle +
                "deg)";
        }

        const statusElement = document.getElementById(
            "qiblaStatus"
        );

        if (statusElement) {
            statusElement.textContent =
                "কিবলা: " + Math.round(qiblaBearing) +
                "° • ফোনের দিক: " + Math.round(heading) + "°";
        }
    };

    window.addEventListener(
        "deviceorientationabsolute",
        compassHandler,
        true
    );

    window.addEventListener(
        "deviceorientation",
        compassHandler,
        true
    );
}

/* =========================================================
   35. STOP COMPASS
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

    const button = document.getElementById("startQiblaBtn");
    const status = document.getElementById("qiblaStatus");

    if (button) {
        button.textContent = "🧭 কিবলা দেখান";
    }

    if (status) {
        status.textContent = "কম্পাস বন্ধ করা হয়েছে।";
    }

    updateQiblaBearing();
}

/* =========================================================
   36. MIDNIGHT REFRESH
========================================================= */

function schedulePrayerMidnightRefresh() {
    if (midnightRefreshTimer) {
        clearTimeout(midnightRefreshTimer);
    }

    /*
     * Check periodically rather than relying on the device's
     * midnight, because the selected city's timezone may differ.
     */
    midnightRefreshTimer = setTimeout(async function () {
        updatePrayerDateText();

        if (
            hasValidCoordinates(
                prayerLocation.latitude,
                prayerLocation.longitude
            )
        ) {
            const today = getCurrentDateForLocation();

            if (today && today !== currentPrayerDate) {
                await loadPrayerTimesForLocation(
                    prayerLocation.latitude,
                    prayerLocation.longitude
                );
            }
        }

        schedulePrayerMidnightRefresh();
    }, 60 * 1000);
}

function getCurrentDateForLocation() {
    try {
        const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        };

        if (currentPrayerTimezone) {
            options.timeZone = currentPrayerTimezone;
        }

        const parts = new Intl.DateTimeFormat("en-CA", options)
            .formatToParts(new Date());
        const values = {};

        parts.forEach(part => {
            if (part.type !== "literal") {
                values[part.type] = part.value;
            }
        });

        if (!values.year || !values.month || !values.day) {
            return "";
        }

        return values.year + "-" + values.month + "-" + values.day;
    } catch (error) {
        console.error("Location date error:", error);
        return "";
    }
}

/* =========================================================
   37. PUBLIC API
========================================================= */

window.QuranSharifPrayer = {
    getLocation: function () {
        return { ...prayerLocation };
    },

    refresh: function () {
        if (
            hasValidCoordinates(
                prayerLocation.latitude,
                prayerLocation.longitude
            )
        ) {
            return loadPrayerTimesForLocation(
                prayerLocation.latitude,
                prayerLocation.longitude
            );
        }

        return Promise.resolve(false);
    },

    refreshLocationPage: refreshLocationPage,

    useGPS: useCurrentGPSLocation,

    saveLocation: saveManualLocation,

    startQibla: startQiblaCompass,

    stopQibla: stopQiblaCompass,

    getQiblaBearing: function () {
        return qiblaBearing;
    },

    getPrayerTimings: function () {
        return currentPrayerTimings
            ? { ...currentPrayerTimings }
            : null;
    },

    formatPrayerTime: formatPrayerTime,

    updateNextPrayer: updateNextPrayer
};

/* =========================================================
   END — QURAN SHARIF PRAYER SYSTEM
========================================================= */

/* =====================================================
QURAN SHARIF — PREMIUM CUSTOM ALERT
Green & Gold Islamic Theme
===================================================== */

(function () {
"use strict";

// Alert CSS একবারই যোগ হবে
if (!document.getElementById("qsAlertStyles")) {
    const style = document.createElement("style");
    style.id = "qsAlertStyles";

    style.textContent = `
        .qs-alert-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 22px;
            background: rgba(5, 20, 14, 0.70);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            opacity: 0;
            visibility: hidden;
            transition: opacity .25s ease,
                        visibility .25s ease;
        }

        .qs-alert-overlay.qs-alert-visible {
            opacity: 1;
            visibility: visible;
        }

        .qs-alert-card {
            position: relative;
            width: 100%;
            max-width: 340px;
            padding: 28px 22px 22px;
            overflow: hidden;
            text-align: center;
            color: #183c2c;
            background: linear-gradient(
                145deg,
                #ffffff 0%,
                #f4f8f0 100%
            );
            border: 1px solid #d6b45d;
            border-radius: 24px;
            box-shadow:
                0 20px 60px rgba(0, 0, 0, .30),
                inset 0 0 0 4px rgba(214, 180, 93, .10);
            transform: translateY(18px) scale(.96);
            transition: transform .25s ease;
            font-family: inherit;
        }

        .qs-alert-visible .qs-alert-card {
            transform: translateY(0) scale(1);
        }

        .qs-alert-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(
                90deg,
                #0b6b45,
                #e1bd59,
                #0b6b45
            );
        }

        .qs-alert-close {
            position: absolute;
            top: 12px;
            right: 13px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 50%;
            background: #e9efe8;
            color: #31513e;
            font-size: 22px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
        }

        .qs-alert-icon {
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px auto 16px;
            border: 1px solid #e2c66f;
            border-radius: 50%;
            background: #edf5e9;
            color: #167447;
            font-size: 34px;
            box-shadow: 0 5px 18px rgba(22, 116, 71, .10);
        }

        .qs-alert-error .qs-alert-icon {
            color: #bd3434;
            background: #fff0ee;
            border-color: #efb9b4;
        }

        .qs-alert-info .qs-alert-icon {
            color: #24659a;
            background: #edf5ff;
            border-color: #bdd8f4;
        }

        .qs-alert-title {
            margin: 0 0 10px;
            color: #13583b;
            font-size: 21px;
            font-weight: 800;
            line-height: 1.4;
        }

        .qs-alert-error .qs-alert-title {
            color: #a52d2d;
        }

        .qs-alert-info .qs-alert-title {
            color: #205b8b;
        }

        .qs-alert-message {
            margin: 0;
            color: #48594d;
            font-size: 15px;
            line-height: 1.8;
            overflow-wrap: anywhere;
            white-space: pre-line;
        }

        .qs-alert-button {
            width: 100%;
            min-height: 46px;
            margin-top: 23px;
            padding: 11px 18px;
            border: 1px solid #d9b853;
            border-radius: 13px;
            background: linear-gradient(
                135deg,
                #0c7048,
                #145237
            );
            color: #fff8dc;
            font-family: inherit;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 5px 12px rgba(12, 112, 72, .18);
            -webkit-tap-highlight-color: transparent;
        }

        .qs-alert-button:active {
            transform: scale(.98);
        }

        @media (max-width: 380px) {
            .qs-alert-overlay {
                padding: 18px;
            }

            .qs-alert-card {
                padding: 25px 18px 19px;
                border-radius: 21px;
            }

            .qs-alert-title {
                font-size: 19px;
            }

            .qs-alert-message {
                font-size: 14px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .qs-alert-overlay,
            .qs-alert-card {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);
}

let currentAlert = null;
let previousFocus = null;

window.showPrayerAlert = function (message, type = "info", title) {
    // আগের অ্যালার্ট থাকলে সেটি সরাও
    if (currentAlert) {
        currentAlert.remove();
        currentAlert = null;
    }

    const config = {
        success: {
            icon: "✓",
            title: title || "সফল হয়েছে"
        },
        error: {
            icon: "!",
            title: title || "দুঃখিত!"
        },
        info: {
            icon: "i",
            title: title || "জানিয়ে রাখি"
        }
    };

    const selected = config[type] || config.info;
    previousFocus = document.activeElement;

    const overlay = document.createElement("div");
    overlay.className = "qs-alert-overlay";

    const card = document.createElement("div");
    card.className = "qs-alert-card qs-alert-" +
        (config[type] ? type : "info");

    card.setAttribute("role", "alertdialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "qsAlertTitle");
    card.setAttribute("aria-describedby", "qsAlertMessage");

    const close = document.createElement("button");
    close.className = "qs-alert-close";
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "বন্ধ করুন");

    const icon = document.createElement("div");
    icon.className = "qs-alert-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = selected.icon;

    const heading = document.createElement("h3");
    heading.className = "qs-alert-title";
    heading.id = "qsAlertTitle";
    heading.textContent = selected.title;

    const text = document.createElement("p");
    text.className = "qs-alert-message";
    text.id = "qsAlertMessage";
    text.textContent = String(message ?? "");

    const button = document.createElement("button");
    button.className = "qs-alert-button";
    button.type = "button";
    button.textContent = "ঠিক আছে";

    card.append(close, icon, heading, text, button);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    currentAlert = overlay;

    function closeAlert() {
        if (currentAlert !== overlay) return;

        overlay.classList.remove("qs-alert-visible");
        document.removeEventListener("keydown", onKeyDown);

        window.setTimeout(function () {
            overlay.remove();

            if (currentAlert === overlay) {
                currentAlert = null;
            }

            if (previousFocus && previousFocus.isConnected) {
                previousFocus.focus();
            }
        }, 250);
    }

    function onKeyDown(event) {
        if (event.key === "Escape") {
            closeAlert();
        }

        if (event.key === "Tab") {
            event.preventDefault();
            button.focus();
        }
    }

    close.addEventListener("click", closeAlert);
    button.addEventListener("click", closeAlert);

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closeAlert();
        }
    });

    document.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(function () {
        overlay.classList.add("qs-alert-visible");
        button.focus();
    });
};

})();