
package com.quransharif.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(
        context: Context,
        intent: Intent?
    ) {
        when (intent?.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_TIME_CHANGED -> {

                // Keep the existing daily notification.
                DailyNotificationScheduler.schedule(context)

                // Reschedule the five daily prayer notifications.
                PrayerNotificationScheduler.schedule(context)
            }
        }
    }
}
