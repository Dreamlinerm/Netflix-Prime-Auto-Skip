from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
import time
import sys

ffOptions = Options()

ffOptions.add_argument("-profile")
ffOptions.add_argument(
    r"C:\Users\Marvin\AppData\Roaming\Mozilla\Firefox\Profiles\35x42i21.test"
)
driver = webdriver.Firefox(options=ffOptions)
extension_path = "NetflixPrime@Autoskip.io.xpi"
driver.install_addon(extension_path, temporary=True)
driver.implicitly_wait(500)


# ## Netflix tests
def Netflix_intro():
    driver.get("https://www.netflix.com/watch/80011385?trackId=14277283")
    # click on profile-icon class
    # driver.find_element(by=By.CLASS_NAME, value="profile-icon").click()
    # click on video element
    driver.implicitly_wait(4)
    driver.find_element(by=By.CLASS_NAME, value="watch-video--autoplay-blocked").click()

    # profile auto pick
    time.sleep(1)
    # driver.implicitly_wait(1)
    # profileNames = driver.find_elements(by=By.CSS_SELECTOR, value=".profile-name")
    # try:
    #     assert len(profileNames) == 0
    #     print("✅: Profile Auto Pick")
    #     output[7][1] = "✅"
    # except Exception as e:
    #     print("❌: Profile Auto Pick")
    #     print(e)

    video = driver.find_element(by=By.TAG_NAME, value="video")
    # video.currentTime = 33  # does not work on netflix
    driver.implicitly_wait(2)
    forwardButton = driver.find_element(
        by=By.XPATH, value="//button[@data-uia='control-forward10']"
    )
    backwardButton = driver.find_element(
        by=By.XPATH, value="//button[@data-uia='control-back10']"
    )
    while video.get_property("currentTime") <= 54:
        forwardButton.click()
        time.sleep(0.3)

    while video.get_property("currentTime") >= 64:
        backwardButton.click()
        time.sleep(0.3)
    time.sleep(8)
    t = video.get_property("currentTime")
    try:
        assert t >= 62
        print("✅: Skip Intro")
        output[1][1] = "✅"
    except Exception as e:
        print("❌: Skip Intro")
        print("time: " + str(t))
        print(e)

    Speed_Slider(1)


def Speed_Slider(position, isPrime=False):
    # Speed Slider Test
    driver.implicitly_wait(3)
    t = driver.find_elements(by=By.ID, value="videoSpeedSlider")
    # set value to 20
    script = "document.querySelector('#videoSpeedSlider').value = 20"
    driver.execute_script(script)

    # create oninput event
    inputEvent = "document.querySelector('#videoSpeedSlider').dispatchEvent(new Event('input', { bubbles: true,cancelable: true,}));"
    driver.execute_script(inputEvent)
    if isPrime:
        video = driver.find_element(by=By.XPATH, value=v)
    else:
        video = driver.find_element(by=By.TAG_NAME, value="video")

    try:
        assert len(t) == 1
        assert video.get_property("playbackRate") == 2
        print("✅: Speed Slider")
        output[5][position] = "✅"
    except Exception as e:
        print("❌: Speed Slider")
        print("playbackRate: " + str(video.get_property("playbackRate")))
        print("len(t): " + str(len(t)))
        print(e)

    script = 'document.querySelector("#videoSpeedSlider").value = 10'
    driver.execute_script(script)
    driver.execute_script(inputEvent)


def Netflix_Profile():
    driver.get("https://www.netflix.com/profiles/manage")
    driver.implicitly_wait(2)
    driver.find_element(by=By.CLASS_NAME, value="profile-button").click()
    time.sleep(1)
    profileNames = driver.find_elements(by=By.CSS_SELECTOR, value=".profile-name")
    try:
        assert len(profileNames) == 0
        print("✅: Profile Auto Pick")
        output[7][1] = "✅"
    except Exception as e:
        print("❌: Profile Auto Pick")
        print(e)


## Amazon Prime tests
v = "//video[not(@preload='auto')]"
AmazonVideoClass = "#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video"


def Amazon_Prime():
    # Intro test
    driver.get(
        "https://www.amazon.de/gp/video/detail/B07FMF18GN/ref=atv_dp_btf_el_prime_sd_tv_resume_t1ALAAAAAA0wr0?autoplay=1&t=1"
    )
    video = driver.find_element(by=By.XPATH, value=v)
    # sleep for 3 seconds
    time.sleep(3)
    skipButton = driver.find_element(
        by=By.CSS_SELECTOR, value=".atvwebplayersdk-skipelement-button"
    )
    # Speed Slider Test
    Speed_Slider(2, True)

    # delay
    wait = WebDriverWait(driver, timeout=5)
    wait.until(lambda driver: video.get_property("currentTime") > 4)
    # assert video time greater than 24
    t = video.get_property("currentTime")
    try:
        assert t >= 16
        print("✅: Skip Intro")
        output[1][2] = "✅"
    except Exception as e:
        print("❌: Skip Intro")
        print("time: " + str(t))
        print(e)

    # delay
    wait = WebDriverWait(driver, timeout=5)
    wait.until(lambda driver: video.get_property("currentTime") > t)
    # Skip Credits test

    script = "document.querySelector('" + AmazonVideoClass + "').currentTime = 2463"
    driver.execute_script(script)

    wait = WebDriverWait(driver, timeout=10)
    try:
        wait.until(lambda driver: video.get_property("currentTime") < 10)
        print("✅: Skip Credits")
        output[3][2] = "✅"
    except Exception as e:
        print("❌: Skip Credits")
        print("time: " + str(video.get_property("currentTime")))
        print(e)

    # Skip Recap Test
    wait = WebDriverWait(driver, timeout=8)
    try:
        wait.until(lambda driver: video.get_property("currentTime") >= 37)
        print("✅: Skip Recap")
        output[2][2] = "✅"
    except Exception as e:
        print("❌: Skip Recap")
        print("time: " + str(time))
        # print error message
        print(e)


def Amazon_Ad():
    driver.get(
        "https://www.amazon.de/gp/video/detail/B00IAJMINK/ref=atv_dp_btf_el_3p_sd_tv_resume_t1AKAAAAAA0wr0?autoplay=1&t=43"
    )
    video = driver.find_element(by=By.XPATH, value=v)
    wait = WebDriverWait(driver, timeout=20)
    try:
        wait.until(lambda driver: video.get_property("currentTime") > 10)
        print("✅: Skip Ad")
        output[4][2] = "✅"
    except Exception as e:
        print("❌: Skip Ad")
        print("time: " + str(video.get_property("currentTime")))
        print(e)


def Amazon_PaidContent():
    driver.get("https://www.amazon.de/gp/video/storefront")
    time.sleep(1)  # Sleep for 1seconds
    # timeout =1
    driver.implicitly_wait(1)
    t = driver.find_elements(by=By.CSS_SELECTOR, value=".o86fri")
    try:
        assert len(t) == 0
        print("✅: No paid content")
        output[6][2] = "✅"
    except Exception as e:
        print("❌: Paid content with length" + str(len(t)))
        print(e)


def Disney_Intro():
    driver.get(
        "https://www.disneyplus.com/en-gb/video/4e9305a0-6ade-4922-bfba-c68c53a0d5a6"
    )
    # play video
    driver.implicitly_wait(5)
    playButton = driver.find_elements(
        by=By.XPATH, value="//div[@data-testid='episode-s1-e2']"
    )
    if len(playButton) > 0:
        playButton[0].click()
        print("clicked play Button")
    else:
        print("no play button found")

    Speed_Slider(3)
    video = driver.find_element(by=By.XPATH, value=v)

    # Skip Intro Test
    while video.get_property("currentTime") > 80:
        driver.execute_script(
            "document.querySelector('.control-icon-btn.rwd-10sec-icon').click()"
        )
        time.sleep(0.3)
    print("time " + str(video.get_property("currentTime")))
    wait = WebDriverWait(driver, timeout=30)
    wait.until(lambda driver: video.get_property("currentTime") >= 80)

    wait = WebDriverWait(driver, timeout=5)
    try:
        wait.until(lambda driver: video.get_property("currentTime") >= 106)
        print("✅: Skip Intro/Recap")
        output[1][3] = "✅"
        output[2][3] = "✅"
    except Exception as e:
        print("❌: Skip Intro/Recap")
        print("time: " + str(time))
        print(e)


def Disney_Credits():
    # Skip Credits Test
    # mickey mouse 5 min
    driver.get(
        "https://www.disneyplus.com/en-gb/video/f0a6ddaf-d754-45e2-ab19-86e678047a17"
    )

    # play video
    driver.implicitly_wait(5)
    playButton = driver.find_elements(
        by=By.XPATH, value="//div[@data-testid='episode-s1-e2']"
    )
    if len(playButton) > 0:
        playButton[0].click()
        print("clicked play Button")
    else:
        print("no play button found")
    video = driver.find_element(by=By.TAG_NAME, value="video")
    while video.get_property("currentTime") < 220:
        driver.execute_script(
            "document.querySelector('.control-icon-btn.ff-10sec-icon').click()"
        )
        time.sleep(0.2)
    driver.implicitly_wait(100)
    nextEpisodeButton = driver.find_element(
        by=By.XPATH, value="//button[@data-gv2elementkey='playNext']"
    )
    print("found playNext")
    # driver.execute_script("document.querySelector('video').playbackRate = 1")
    time.sleep(1)
    video = driver.find_element(by=By.TAG_NAME, value="video")
    t = video.get_property("currentTime")
    try:
        assert t < 5
        print("✅: Skip Credits")
        output[3][3] = "✅"
    except Exception as e:
        print("❌: Skip Credits")
        print("time: " + str(t))
        print(e)


output = [
    ["", "Netflix", "Prime Video", "Disney+"],
    ["Intro", "❌", "❌", "❌"],
    ["Recaps", "❕", "❌", "❌"],
    ["Credits", "❕", "❌", "❌"],
    ["Ads", "❕", "❌", "➖"],
    ["Speed Slider", "❌", "❌", "❌"],
    ["Paid Content", "➖", "❌", "➖"],
    ["Profile", "❌", "➖", "➖"],
]

if len(sys.argv) <= 1 or "p" in sys.argv:
    print("Amazon Prime:")
    Amazon_Ad()
    Amazon_Prime()
    Amazon_PaidContent()

if len(sys.argv) <= 1 or "n" in sys.argv:
    print("Netflix:")
    Netflix_Profile()
    Netflix_intro()

if len(sys.argv) <= 1 or "d" in sys.argv:
    print("Disney:")
    Disney_Intro()
    Disney_Credits()

format_row = "{:>12}" + "{:^12}" * (len(output[0]) - 1)
for row in output:
    print(format_row.format(*row))

driver.quit()
