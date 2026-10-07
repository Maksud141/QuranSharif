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
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    companion object {

        private const val NOTIFICATION_PERMISSION_REQUEST = 1001

        private const val NOTIFICATION_CHANNEL_ID =
            "quran_daily_notification"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // =====================================================
        // Notification Channel
        // =====================================================

        createNotificationChannel()


        // =====================================================
        // Android 13+ Notification Permission
        // =====================================================

        requestNotificationPermission()


        // =====================================================
        // Android 12+ Exact Alarm Permission
        // =====================================================

        requestExactAlarmPermission()


        // =====================================================
        // Daily 9:00 PM Notification Schedule
        // =====================================================

        DailyNotificationScheduler.schedule(this)


        // =====================================================
        // WebView
        // =====================================================

        webView = WebView(this)

        webView.settings.apply {

            // JavaScript
            javaScriptEnabled = true

            // LocalStorage
            domStorageEnabled = true

            // Local file/content access
            allowFileAccess = true
            allowContentAccess = true

            // Zoom বন্ধ
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)

            // Text/HTML rendering
            loadsImagesAutomatically = true

            // Database support
            databaseEnabled = true

            // Prevent automatic media zoom
            useWideViewPort = false
            loadWithOverviewMode = false
        }


        // =====================================================
        // WebView Asset Loader
        //
        // file:///android_asset/
        // এর পরিবর্তে
        //
        // https://appassets.androidplatform.net/assets/
        //
        // ব্যবহার করা হচ্ছে।
        // =====================================================

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler(
                "/assets/",
                WebViewAssetLoader.AssetsPathHandler(this)
            )
            .build()


        // =====================================================
        // WebView Client
        // =====================================================

        webView.webViewClient = object : WebViewClient() {

            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {

                return assetLoader.shouldInterceptRequest(
                    request.url
                )
            }

            @Suppress("DEPRECATION")
            override fun shouldInterceptRequest(
                view: WebView,
                url: String
            ): WebResourceResponse? {

                return assetLoader.shouldInterceptRequest(
                    Uri.parse(url)
                )
            }
        }


        // =====================================================
        // Load App
        //
        // IMPORTANT:
        // আর file:///android_asset/index.html নয়
        // =====================================================

        webView.loadUrl(
            "https://appassets.androidplatform.net/assets/index.html"
        )


        // =====================================================
        // Show WebView
        // =====================================================

        setContentView(webView)
    }


    // =========================================================
    // Notification Channel
    // =========================================================

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


    // =========================================================
    // Android 13+ Notification Permission
    // =========================================================

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


    // =========================================================
    // Android 12+ Exact Alarm Permission
    // =========================================================

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
                    // app স্বাভাবিকভাবে চলবে।
                }
            }
        }
    }


    // =========================================================
    // Android Back Button
    // =========================================================

    @Suppress("DEPRECATION")
    override fun onBackPressed() {

        if (webView.canGoBack()) {

            webView.goBack()

        } else {

            super.onBackPressed()
        }
    }


    // =========================================================
    // Destroy WebView
    // =========================================================

    override fun onDestroy() {

        webView.destroy()

        super.onDestroy()
    }
}
