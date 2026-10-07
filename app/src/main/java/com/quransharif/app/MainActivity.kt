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
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader


class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    /*
     * WebView GPS permission callback
     */
    private var pendingGeoOrigin: String? = null

    private var pendingGeoCallback:
        GeolocationPermissions.Callback? = null


    companion object {

        private const val NOTIFICATION_CHANNEL_ID =
            "quran_daily_notification"

    }


    /*
     * =====================================================
     * LOCATION PERMISSION RESULT
     * AndroidX Activity Result API
     * =====================================================
     */

    private val locationPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->

            val fineGranted =
                permissions[
                    Manifest.permission.ACCESS_FINE_LOCATION
                ] == true

            val coarseGranted =
                permissions[
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ] == true


            val granted =
                fineGranted || coarseGranted


            val origin =
                pendingGeoOrigin


            val callback =
                pendingGeoCallback


            if (
                origin != null &&
                callback != null
            ) {

                callback.invoke(
                    origin,
                    granted,
                    false
                )

            }


            pendingGeoOrigin = null

            pendingGeoCallback = null

        }


    /*
     * =====================================================
     * NOTIFICATION PERMISSION
     * Android 13+
     * =====================================================
     */

    private val notificationPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) {
            // Notification permission result.
            // আলাদা কোনো কাজ প্রয়োজন নেই।
        }


    /*
     * =====================================================
     * ON CREATE
     * =====================================================
     */

    override fun onCreate(
        savedInstanceState: Bundle?
    ) {

        super.onCreate(savedInstanceState)


        /* =================================================
           NOTIFICATION
        ================================================= */

        createNotificationChannel()

        requestNotificationPermission()

        requestExactAlarmPermission()


        /* =================================================
           DAILY NOTIFICATION
        ================================================= */

        DailyNotificationScheduler.schedule(this)


        /* =================================================
           WEBVIEW
        ================================================= */

        webView = WebView(this)


        webView.settings.apply {

            javaScriptEnabled = true

            domStorageEnabled = true

            allowFileAccess = true

            allowContentAccess = true

            setSupportZoom(false)

            builtInZoomControls = false

            displayZoomControls = false

            loadsImagesAutomatically = true

            databaseEnabled = true

            useWideViewPort = false

            loadWithOverviewMode = false


            /*
             * GPS / Geolocation
             */
            setGeolocationEnabled(true)

        }


        /* =================================================
           WEBVIEW ASSET LOADER
        ================================================= */

        val assetLoader =
            WebViewAssetLoader.Builder()
                .addPathHandler(
                    "/assets/",
                    WebViewAssetLoader.AssetsPathHandler(this)
                )
                .build()


        /* =================================================
           WEBVIEW CLIENT
        ================================================= */

        webView.webViewClient =
            object : WebViewClient() {

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


        /* =================================================
           WEB CHROME CLIENT
           GPS permission
        ================================================= */

        webView.webChromeClient =
            object : WebChromeClient() {

                override fun onGeolocationPermissionsShowPrompt(
                    origin: String,
                    callback: GeolocationPermissions.Callback
                ) {

                    /*
                     * Android location permission
                     * already granted?
                     */

                    val fineGranted =
                        ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED


                    val coarseGranted =
                        ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED


                    /*
                     * Permission already আছে।
                     */

                    if (
                        fineGranted ||
                        coarseGranted
                    ) {

                        callback.invoke(
                            origin,
                            true,
                            false
                        )

                        return

                    }


                    /*
                     * Permission এখন চাইতে হবে।
                     */

                    pendingGeoOrigin =
                        origin

                    pendingGeoCallback =
                        callback


                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )

                }

            }


        /* =================================================
           EDGE-TO-EDGE / SYSTEM BAR INSETS

           Android 15 + targetSdk 35
        ================================================= */

        ViewCompat.setOnApplyWindowInsetsListener(
            webView
        ) { view, insets ->

            val systemBars =
                insets.getInsets(
                    WindowInsetsCompat.Type.systemBars()
                )


            view.setPadding(
                0,
                systemBars.top,
                0,
                systemBars.bottom
            )


            insets

        }


        /* =================================================
           LOAD APP
        ================================================= */

        webView.loadUrl(
            "https://appassets.androidplatform.net/assets/index.html"
        )


        /* =================================================
           SHOW WEBVIEW
        ================================================= */

        setContentView(webView)

    }


    /* =====================================================
       NOTIFICATION CHANNEL
    ===================================================== */

    private fun createNotificationChannel() {

        if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.O
        ) {

            val channel =
                NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "দৈনিক কুরআন নোটিফিকেশন",
                    NotificationManager.IMPORTANCE_DEFAULT
                )


            channel.description =
                "প্রতিদিন রাত ৯টায় কুরআন শরীফের নোটিফিকেশন"


            val manager =
                getSystemService(
                    NotificationManager::class.java
                )


            manager.createNotificationChannel(
                channel
            )

        }

    }


    /* =====================================================
       NOTIFICATION PERMISSION
       Android 13+
    ===================================================== */

    private fun requestNotificationPermission() {

        if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.TIRAMISU
        ) {

            val granted =
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED


            if (!granted) {

                notificationPermissionLauncher.launch(
                    Manifest.permission.POST_NOTIFICATIONS
                )

            }

        }

    }


    /* =====================================================
       EXACT ALARM PERMISSION
       Android 12+
    ===================================================== */

    private fun requestExactAlarmPermission() {

        if (
            Build.VERSION.SDK_INT >=
            Build.VERSION_CODES.S
        ) {

            val alarmManager =
                getSystemService(
                    AlarmManager::class.java
                )


            if (
                !alarmManager.canScheduleExactAlarms()
            ) {

                try {

                    val intent =
                        Intent(
                            Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
                        )


                    intent.data =
                        Uri.parse(
                            "package:$packageName"
                        )


                    startActivity(intent)

                } catch (
                    error: Exception
                ) {

                    error.printStackTrace()

                }

            }

        }

    }


    /* =====================================================
       ANDROID BACK BUTTON
    ===================================================== */

    @Suppress("DEPRECATION")
    override fun onBackPressed() {

        if (
            webView.canGoBack()
        ) {

            webView.goBack()

        } else {

            super.onBackPressed()

        }

    }


    /* =====================================================
       DESTROY
    ===================================================== */

    override fun onDestroy() {

        pendingGeoOrigin = null

        pendingGeoCallback = null


        webView.destroy()


        super.onDestroy()

    }

}
