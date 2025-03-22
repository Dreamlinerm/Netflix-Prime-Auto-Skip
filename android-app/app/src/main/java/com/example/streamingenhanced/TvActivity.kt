package com.example.streamingenhanced

import android.webkit.WebView
import android.webkit.WebSettings
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import android.os.Bundle
import android.util.Log
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.JavascriptInterface
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader

class TvActivity : ComponentActivity() {
    private val amazon = true
    private val amazonUrl = "https://www.amazon.de/gp/video/storefront"
    private val amazonFile = "amazon.js"
    private val disney = false
    private val disneyUrl = "https://www.disneyplus.com"
    private val disneyFile = "disney.js"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Find the WebView by its unique ID
        val webView = findViewById<WebView>(R.id.web)
        
        webView.settings.setMediaPlaybackRequiresUserGesture(false); // This might be necessary for autoplay
        webView.settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW); // Allowing mixed content
        webView.settings.allowFileAccess = true // Allow file access
        webView.settings.allowContentAccess = true // Allow content access
        webView.settings.domStorageEnabled = true // Enable DOM storage
        Log.d("EnhancedLog", "TvActivity");

        // Add Permissions-Policy header
        webView.settings.userAgentString = webView.settings.userAgentString + " Permissions-Policy: interest-cohort=()"

        // Modify the user agent
        // TV User Agent
        webView.settings.userAgentString = "Mozilla/5.0 (Linux; Android 14; SH-M26 Build/SA181; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.108 Mobile Safari/537.36 Instagram 372.0.0.48.60 Android (34/14; 490dpi; 1080x2213; SHARP; SH-M26; Quess; qcom; in_ID; 709818019)"

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                val resources = request?.resources
                resources?.forEach { resource ->
                    if (
                        PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID == resource
                    ) {
                        request.grant(resources)
                        return
                    }
                }
                super.onPermissionRequest(request)
            }
        }
        webView.settings.javaScriptEnabled = true

        // Set a custom WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Modify the content inside the WebView
                if (amazon) {
                    modifyWebViewContent(webView, amazonFile)
                } else if (disney) {
                    modifyWebViewContent(webView, disneyFile)
                }
            }
            // error could not load scripts
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && url.startsWith("chrome-extension://")) {
                    // Handle the unsupported URL scheme
                    return true
                }
                return super.shouldOverrideUrlLoading(view, url)
            }
        }

        // Add JavaScript interface
        webView.addJavascriptInterface(WebAppInterface(this), "Android")
        if (amazon) {
            webView.loadUrl(amazonUrl)
        } else if (disney) {
            webView.loadUrl(disneyUrl)
        }
        // modifyWebViewContent(webView)
    }

    private fun modifyWebViewContent(webView: WebView, fileName: String) {
        val jsCode = loadJsCodeFromFile(fileName)
        Log.d("Enhanced", "evaluateJavascript");
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