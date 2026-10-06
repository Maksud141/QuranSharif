package com.quransharif.app

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    companion object {
        private const val NOTIFICATION_PERMISSION_REQUEST = 1001
        private const val NOTIFICATION_CHANNEL_ID =
            "quran_daily_notification"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Notification channel
        createNotificationChannel()

        // Android 13+ notification permission
        requestNotificationPermission()

        // Android 12+ exact alarm permission
        requestExactAlarmPermission()

        // প্রতিদিন রাত ৯টার notification schedule
        DailyNotificationScheduler.schedule(this)

        // WebView
        webView = WebView(this)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true

            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
        }

        webView.webViewClient = WebViewClient()

        webView.loadUrl(
            "file:///android_asset/index.html"
        )

        setContentView(webView)
    }

    private fun createNotificationChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "কুরআন শরীফ — Daily Notification",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {

                description =
                    "কুরআন শরীফের দৈনিক নোটিফিকেশন"
            }

            val notificationManager =
                getSystemService(
                    NotificationManager::class.java
                )

            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun requestNotificationPermission() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {

            if (
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {

                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(
                        Manifest.permission.POST_NOTIFICATIONS
                    ),
                    NOTIFICATION_PERMISSION_REQUEST
                )
            }
        }
    }

    private fun requestExactAlarmPermission() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            val alarmManager =
                getSystemService(
                    AlarmManager::class.java
                )

            if (!alarmManager.canScheduleExactAlarms()) {

                try {

                    val intent = Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse(
                            "package:$packageName"
                        )
                    )

                    startActivity(intent)

                } catch (e: Exception) {

                    // Permission screen unavailable হলে
                    // app স্বাভাবিকভাবেই চলবে।
                }
            }
        }
    }

    override fun onBackPressed() {

        if (webView.canGoBack()) {

            webView.goBack()

        } else {

            super.onBackPressed()
        }
    }

    override fun onDestroy() {

        webView.destroy()

        super.onDestroy()
    }
}