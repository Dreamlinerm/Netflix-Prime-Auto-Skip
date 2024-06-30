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
from bs4 import BeautifulSoup
import re

url = "https://chromewebstore.google.com/detail/streaming-enhanced-netfli/akaimhgappllmlkadblbdknhbfghdgle?hl="
l = ["en"]
output = "<html><head>"
position = 0

re_pattern = re.compile(
    r'<div class="NV6quc".*?<section class="T7rvce".*?<\/section></div>', re.DOTALL
)

for languageCode in languageCodes:
    response = requests.get(url + languageCode)
    soup = BeautifulSoup(response.text, "html.parser")

    if position == 0:
        # Extract and add all the CSS in the file to output
        styles = soup.find_all("style")
        for style in styles:
            output += str(style)
        output += "</head><body>"
        position += 1

    # Use CSS selectors or other BeautifulSoup methods to find the desired content
    content = soup.select_one("div.NV6quc, section.T7rvce")
    if re.findall(re_pattern, str(content)):
        output += f"<h1>{languageCode}</h1>{str(content)}"
    else:
        print(f"no comment in {languageCode}")

output += "</body></html>"

with open("ChromeReviews.html", "w", encoding="utf-8") as file:
    file.write(output)
