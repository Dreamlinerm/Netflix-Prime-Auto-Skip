languageCodes = [
    "am",
    "ar",
    "bn",
    "en",
    "pt-BR",
    "bg",
    "ca",
    "hr",
    "cs",
    "da",
    "nl",
    "et",
    "fil",
    "fi",
    "fr",
    "de",
    "el",
    "gu",
    "iw",
    "hi",
    "hu",
    "id",
    "it",
    "ja",
    "kn",
    "ko",
    "lv",
    "lt",
    "ms",
    "ml",
    "mr",
    "no",
    "pl",
    "pt",
    "ro",
    "ru",
    "sr",
    "zh-CN",
    "sk",
    "sl",
    "es",
    "sw",
    "sv",
    "ta",
    "te",
    "th",
    "zh-TW",
    "tr",
    "uk",
    "vi",
]
# fetch every comment on every website with the previous language codes and the url https://chromewebstore.google.com/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle?hl=LANGUAGECODE
# and save the comments in a file named LANGUAGECODE.json

import requests
import json
import time
import re

url = "https://chromewebstore.google.com/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle?hl="
l = ["en"]
output = "<html><head>"
position = 0
for languageCode in languageCodes:
    response = requests.get(url + languageCode)
    if position == 0:
        # add all the css in the file to output
        re_pattern = r"<style.*?</style>"
        x = re.findall(re_pattern, response.text)
        for i in x:
            output += i
        output += "</head><body>"
        position += 1
    re_pattern = re.compile(
        r'<div class="NV6quc".*?<section class="T7rvce".*?<\/section></div>', re.DOTALL
    )
    x = re.findall(re_pattern, response.text)
    if x:
        output += "<h1>" + languageCode + "</h1>"
        for i in x:
            output += i
    else:
        print("no comment in " + languageCode)
output += "</body></html>"
with open("ChromeReviews.html", "w", encoding="utf-8") as file:
    file.write(output)
