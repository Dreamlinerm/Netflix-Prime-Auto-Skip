package com.example.streamingenhanced

import android.app.AlertDialog
import android.os.Bundle
import android.util.Log
import android.webkit.*
import android.widget.ArrayAdapter
import android.widget.Spinner
import androidx.activity.ComponentActivity
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader

class TvActivity : ComponentActivity() {
    private val TVUA = "Mozilla/5.0 (Linux; Android 14; SH-M26 Build/SA181; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.108 Mobile Safari/537.36 Instagram 372.0.0.48.60 Android (34/14; 490dpi; 1080x2213; SHARP; SH-M26; Quess; qcom; in_ID; 709818019)"
    private val chromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 GLS/100.10.9939.100"
    private val firefoxUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.1"
    private val websites = mapOf(
        "Amazon.com" to Triple("https://www.amazon.com/gp/video/storefront", "amazon.js", chromeUA),
        "Amazon.co.jp" to Triple("https://www.amazon.co.jp/gp/video/storefront", "amazon.js", chromeUA),
        "Amazon.co.uk" to Triple("https://www.amazon.co.uk/gp/video/storefront", "amazon.js", chromeUA),
        "Amazon.de" to Triple("https://www.amazon.de/gp/video/storefront", "amazon.js", chromeUA),
        "Primevideo.com" to Triple("https://www.primevideo.com/", "amazon.js", chromeUA),
        "Disney DE" to Triple("https://www.disneyplus.com/de-de", "disney.js", chromeUA),
        "Starplus" to Triple("https://www.starplus.com", "disney.js", chromeUA)
    )
    // default 'Mozilla/5.0 (Linux; Android 14; AOSP TV on x86 Build/UTT1.240131.001.F1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36'

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.web)
        setupWebView(webView)

        showWebsiteSelectionDialog(webView)
    }

    private fun setupWebView(webView: WebView) {
        webView.settings.setMediaPlaybackRequiresUserGesture(false)
        webView.settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.domStorageEnabled = true
        // set scale of website to 1
        webView.settings.setUseWideViewPort(true)
        webView.setInitialScale(1)
        // Enable WebView debugging
        WebView.setWebContentsDebuggingEnabled(true)

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                val resources = request?.resources
                resources?.forEach { resource ->
                    if (PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID == resource) {
                        request.grant(resources)
                        return
                    }
                }
                super.onPermissionRequest(request)
            }
        }
        webView.settings.javaScriptEnabled = true
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                val selectedWebsite = view?.tag as? String
                val fileName = websites[selectedWebsite]?.second
                if (fileName != null) {
                    modifyWebViewContent(webView, fileName)
                }
                modifyWebViewContent(webView, "shared-functions.js")
            }
            // error could not load scripts
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && url.startsWith("chrome-extension://")) {
                    return true
                }
                return super.shouldOverrideUrlLoading(view, url)
            }
        }
        webView.addJavascriptInterface(WebAppInterface(this), "Android")
    }

    private fun showWebsiteSelectionDialog(webView: WebView) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_website_selection, null)
        val spinner = dialogView.findViewById<Spinner>(R.id.website_spinner)

        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, websites.keys.toList())
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinner.adapter = adapter

        AlertDialog.Builder(this)
            .setTitle("Select Website")
            .setView(dialogView)
            .setPositiveButton("OK") { _, _ ->
                val selectedWebsite = spinner.selectedItem.toString()
                val url = websites[selectedWebsite]?.first
                webView.settings.userAgentString = websites[selectedWebsite]?.third
                webView.tag = selectedWebsite
                if (url != null) {
                    webView.loadUrl(url)
                }
            }
            .setCancelable(false)
            .show()
    }

    private fun modifyWebViewContent(webView: WebView, fileName: String) {
        val jsCode = loadJsCodeFromFile(fileName)
        Log.d("Enhanced", "evaluateJavascript")
        webView.evaluateJavascript(jsCode, null)
    }

    private fun loadJsCodeFromFile(fileName: String): String {
        val inputStream = assets.open(fileName)
        val bufferedReader = BufferedReader(InputStreamReader(inputStream))
        return bufferedReader.use { it.readText() }
    }

    // JavaScript interface class
    class WebAppInterface(private val activity: TvActivity) {
        @JavascriptInterface
        fun sendMessage(message: String) {
            //Log.d("WebAppInterface", "Message from JS: $message")
            try {
                val jsonObject = JSONObject(message)
                // Handle the JSON message here
                Log.d("WebAppInterface", "JSON message: ${jsonObject.toString()}")
            } catch (e: Exception) {
                Log.e("WebAppInterface", "Failed to parse JSON message", e)
            }
        }
    }
}