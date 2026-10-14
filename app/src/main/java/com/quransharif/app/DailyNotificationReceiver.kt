
package com.quransharif.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject

class DailyNotificationReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "quran_daily_notification"
        private const val NOTIFICATION_ID = 9001
        private const val PREFS_NAME = "daily_content_native"
        private const val CONTENT_KEY = "data_json"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        createChannel(context)
        showNotification(context)

        // পরবর্তী রাত ৯টার অ্যালার্ম সেট
        DailyNotificationScheduler.schedule(context)
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(
                Context.NOTIFICATION_SERVICE
            ) as NotificationManager

            val channel = NotificationChannel(
                CHANNEL_ID,
                "Daily Quran Reminder",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Daily Quran and Hadith reminder"
            }

            manager.createNotificationChannel(channel)
        }
    }

    private fun showNotification(context: Context) {
        val manager = context.getSystemService(
            Context.NOTIFICATION_SERVICE
        ) as NotificationManager

        val openAppIntent = Intent(
            context,
            MainActivity::class.java
        ).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
        )

        val content = getSavedContent(context)

        val title = "কুরআন শরীফ"
        val body = content ?: "আজকের আয়াত ও হাদিস পড়ুন 🌙"

        val notification = NotificationCompat.Builder(
            context,
            CHANNEL_ID
        )
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(
                NotificationCompat.BigTextStyle().bigText(body)
            )
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        // Android 13+ অনুমতি না থাকলে সিস্টেম নোটিফিকেশন দেখাতে নাও পারে।
        try {
            manager.notify(NOTIFICATION_ID, notification)
        } catch (e: SecurityException) {
            android.util.Log.e(
                "DailyNotification",
                "Notification permission missing",
                e
            )
        }
    }

    private fun getSavedContent(context: Context): String? {
        return try {
            val prefs = context.getSharedPreferences(
                PREFS_NAME,
                Context.MODE_PRIVATE
            )

            val raw = prefs.getString(CONTENT_KEY, null)
                ?: return null

            val data = JSONObject(raw)
            val ayah = data.optJSONObject("ayah")
            val hadith = data.optJSONObject("hadith")

            val parts = mutableListOf<String>()

            ayah?.optString("arabic", "")
                ?.takeIf { it.isNotBlank() }
                ?.let { parts.add("📖 $it") }

            ayah?.optString("bengali", "")
                ?.takeIf { it.isNotBlank() }
                ?.let { parts.add(it) }

            hadith?.optString("bengali", "")
                ?.takeIf { it.isNotBlank() }
                ?.let { parts.add("📜 আজকের হাদিস:\n$it") }

            parts.joinToString("\n\n").takeIf {
                it.isNotBlank()
            }
        } catch (e: Exception) {
            android.util.Log.e(
                "DailyNotification",
                "Could not read saved content",
                e
            )
            null
        }
    }
}
