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

class MainActivity : ComponentActivity() {

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
        Log.d("EnhancedLog", "MainActivity");

        // Add Permissions-Policy header
        webView.settings.userAgentString = webView.settings.userAgentString + " Permissions-Policy: interest-cohort=()"

        // Modify the user agent
        webView.settings.userAgentString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"

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
                modifyWebViewContent(webView)
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

        webView.loadUrl("https://www.disneyplus.com")
        // modifyWebViewContent(webView)
    }

    private fun modifyWebViewContent(webView: WebView) {
        val jsCode = loadJsCodeFromFile("disney.js")
        Log.d("Enhanced", "evaluateJavascript");
        webView.evaluateJavascript(jsCode, null)
    }

    private fun loadJsCodeFromFile(fileName: String): String {
        val inputStream = assets.open(fileName)
        val bufferedReader = BufferedReader(InputStreamReader(inputStream))
        return bufferedReader.use { it.readText() }
    }

    // JavaScript interface class
    class WebAppInterface(private val activity: MainActivity) {
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