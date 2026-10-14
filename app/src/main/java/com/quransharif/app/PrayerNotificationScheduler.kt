
package com.quransharif.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

object PrayerNotificationScheduler {

    private const val PREFS_NAME = "prayer_notification_prefs"
    private const val CONTENT_KEY = "prayer_timings_json"
    private const val TAG = "PrayerNotificationScheduler"

    private data class Prayer(
        val key: String,
        val displayName: String
    )

    private val prayers = listOf(
        Prayer("fajr", "ফজর"),
        Prayer("dhuhr", "যোহর"),
        Prayer("asr", "আসর"),
        Prayer("maghrib", "মাগরিব"),
        Prayer("isha", "এশা")
    )

    fun schedule(context: Context) {
        try {
            val prefs = context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val jsonText = prefs.getString(CONTENT_KEY, null) ?: return
            val data = JSONObject(jsonText)
            val days = data.optJSONArray("days") ?: return

            val timezoneId = data.optString(
                "timeZone",
                TimeZone.getDefault().id
            ).ifBlank { TimeZone.getDefault().id }

            val timezone = TimeZone.getTimeZone(timezoneId)
            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            val now = System.currentTimeMillis()

            for (dayIndex in 0 until days.length()) {
                val day = days.optJSONObject(dayIndex) ?: continue
                val dateKey = day.optString("dateKey", "")

                if (dateKey.isBlank()) continue

                val dateParts = dateKey.split("-")
                if (dateParts.size != 3) continue

                val year = dateParts[0].toIntOrNull() ?: continue
                val month = dateParts[1].toIntOrNull() ?: continue
                val date = dateParts[2].toIntOrNull() ?: continue

                if (month !in 1..12 || date !in 1..31) continue

                for ((prayerIndex, prayer) in prayers.withIndex()) {
                    val timeText = day.optString(prayer.key, "")
                    val match = Regex("""^(\d{1,2}):(\d{2})$""")
                        .matchEntire(timeText) ?: continue

                    val hour = match.groupValues[1].toIntOrNull() ?: continue
                    val minute = match.groupValues[2].toIntOrNull() ?: continue

                    if (hour !in 0..23 || minute !in 0..59) continue

                    val calendar = Calendar.getInstance(timezone).apply {
                        clear()
                        set(Calendar.YEAR, year)
                        set(Calendar.MONTH, month - 1)
                        set(Calendar.DAY_OF_MONTH, date)
                        set(Calendar.HOUR_OF_DAY, hour)
                        set(Calendar.MINUTE, minute)
                        set(Calendar.SECOND, 0)
                        set(Calendar.MILLISECOND, 0)
                    }

                    // Reject invalid dates such as 2026-02-31.
                    if (
                        calendar.get(Calendar.YEAR) != year ||
                        calendar.get(Calendar.MONTH) != month - 1 ||
                        calendar.get(Calendar.DAY_OF_MONTH) != date
                    ) continue

                    val triggerAt = calendar.timeInMillis

                    // Do not schedule a prayer time that has already passed.
                    if (triggerAt <= now) continue

                    val pendingIntent = createPendingIntent(
                        context = context,
                        dateKey = dateKey,
                        prayerIndex = prayerIndex,
                        displayName = prayer.displayName
                    )

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            triggerAt,
                            pendingIntent
                        )
                    } else {
                        alarmManager.set(
                            AlarmManager.RTC_WAKEUP,
                            triggerAt,
                            pendingIntent
                        )
                    }
                }
            }

            Log.d(TAG, "Prayer alarms scheduled")
        } catch (e: Exception) {
            Log.e(TAG, "Could not schedule prayer notifications", e)
        }
    }

    fun cancelScheduled(context: Context, data: JSONObject) {
        try {
            val days = data.optJSONArray("days") ?: return
            val alarmManager = context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

            for (dayIndex in 0 until days.length()) {
                val day = days.optJSONObject(dayIndex) ?: continue
                val dateKey = day.optString("dateKey", "")

                if (dateKey.isBlank()) continue

                for ((prayerIndex, prayer) in prayers.withIndex()) {
                    val pendingIntent = createPendingIntent(
                        context = context,
                        dateKey = dateKey,
                        prayerIndex = prayerIndex,
                        displayName = prayer.displayName
                    )

                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Could not cancel prayer alarms", e)
        }
    }

    private fun createPendingIntent(
        context: Context,
        dateKey: String,
        prayerIndex: Int,
        displayName: String
    ): PendingIntent {
        val parts = dateKey.split("-")
        val year = parts.getOrNull(0)?.toIntOrNull() ?: 2000
        val month = parts.getOrNull(1)?.toIntOrNull() ?: 1
        val date = parts.getOrNull(2)?.toIntOrNull() ?: 1

        val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            clear()
            set(year, month - 1, date, 0, 0, 0)
        }

        val yearPart = year % 100
        val dayOfYear = calendar.get(Calendar.DAY_OF_YEAR)
        val requestCode = ((yearPart * 366 + dayOfYear) * 5) + prayerIndex

        val intent = Intent(
            context,
            PrayerNotificationReceiver::class.java
        ).apply {
            putExtra("prayer_name", displayName)
            putExtra("prayer_date", dateKey)
        }

        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )
    }
}
