from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
import time

ffOptions = Options()

ffOptions.add_argument("-profile")
ffOptions.add_argument(
    r"C:\Users\Marvin\AppData\Roaming\Mozilla\Firefox\Profiles\fd74ra9i.test"
)
driver = webdriver.Firefox(options=ffOptions)
extension_path = "NetflixPrime@Autoskip.io.xpi"
driver.install_addon(extension_path, temporary=True)
driver.implicitly_wait(500)

# ## Netflix tests
# driver.get("https://www.netflix.com/watch/80011385")
# # click on profile-icon class
# # driver.find_element(by=By.CLASS_NAME, value="profile-icon").click()
# # click on video element
# driver.find_element(by=By.CLASS_NAME, value="watch-video--autoplay-blocked").click()

# video = driver.find_element(by=By.TAG_NAME, value="video")
# print(video)
# video.currentTime = 33  # does not work on netflix


## Amazon Prime tests
v = "//video[not(@preload='auto')]"
AmazonVideoClass = "#dv-web-player > div > div:nth-child(1) > div > div > div.scalingVideoContainer > div.scalingVideoContainerBottom > div > video"


def Amazon_Prime():
    # Intro test
    driver.get(
        "https://www.amazon.de/gp/video/detail/B07FMF18GN/ref=atv_dp_btf_el_prime_sd_tv_resume_t1ALAAAAAA0wr0?autoplay=1&t=0"
    )
    # driver.find_element(by=By.XPATH, value="//span[text()='S3 F3']").click()
    playButton = driver.find_element(by=By.XPATH, value="//button[@aria-label='Play']")
    playButton.click()
    skipButton = driver.find_element(
        by=By.CSS_SELECTOR, value=".atvwebplayersdk-skipelement-button"
    )
    # Speed Slider Test
    t = driver.find_elements(by=By.ID, value="videoSpeedSlider")
    try:
        assert len(t) == 1
        print("✅: Speed Slider")
    except Exception as e:
        print("❌: Speed Slider")
        print(e)

    video = driver.find_element(by=By.XPATH, value=v)
    # assert video time greater than 24
    time = video.get_property("currentTime")
    try:
        assert time >= 16
        print("✅: Skip Intro")
    except Exception as e:
        print("❌: Skip Intro")
        print("time: " + str(time))
        print(e)

    # delay
    wait = WebDriverWait(driver, timeout=2)
    wait.until(lambda driver: video.get_property("currentTime") > time)
    # Skip Credits test

    script = "document.querySelector('" + AmazonVideoClass + "').currentTime = 2463"
    driver.execute_script(script)

    adPanel = driver.find_element(
        by=By.CSS_SELECTOR, value=".atvwebplayersdk-nextupcard-button"
    )
    wait = WebDriverWait(driver, timeout=2)
    try:
        wait.until(lambda driver: video.get_property("currentTime") < 10)
        print("✅: Skip Credits")
    except Exception as e:
        print("❌: Skip Credits")
        time = video.get_property("currentTime")
        print("time: " + str(time))
        print(e)

    # try:
    #     assert time < 10
    #     print("✅: Skip Credits")
    # except Exception as e:
    #     print("❌: Skip Credits")
    #     print("time: " + str(time))

    # Skip Recap Test
    wait = WebDriverWait(driver, timeout=5)
    wait.until(lambda driver: video.get_property("currentTime") > 0)

    RecapSkipButton = driver.find_element(
        by=By.CSS_SELECTOR, value=".atvwebplayersdk-skipelement-button"
    )
    time = video.get_property("currentTime")

    try:
        assert time >= 37
        print("✅: Skip Recap")
    except Exception as e:
        print("❌: Skip Recap")
        print("time: " + str(time))
        # print error message
        print(e)


def Amazon_Ad():
    driver.get(
        "https://www.amazon.de/gp/video/detail/B00IAJMINK/ref=atv_dp_btf_el_3p_sd_tv_resume_t1AKAAAAAA0wr0?autoplay=1&t=43"
    )
    playButton = driver.find_element(by=By.XPATH, value="//button[@aria-label='Play']")
    playButton.click()

    v = "//video[not(@preload='auto')]"
    print(v)
    video = driver.find_element(by=By.XPATH, value=v)

    script = "document.querySelector('" + AmazonVideoClass + "').currentTime = 719"
    driver.execute_script(script)

    time = video.get_property("currentTime")

    wait = WebDriverWait(driver, timeout=5)
    try:
        wait.until(lambda driver: video.get_property("currentTime") > time)
        print("✅: Skip Ad")
    except Exception as e:
        print("❌: Skip Ad")
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

    # Speed Slider Test
    t = driver.find_elements(by=By.ID, value="videoSpeedSlider")
    try:
        assert len(t) == 1
        print("✅: Speed Slider")
    except Exception as e:
        print("❌: Speed Slider")
        print(e)

    # Skip Intro Test
    video = driver.find_element(by=By.TAG_NAME, value="video")
    while video.get_property("currentTime") > 80:
        driver.execute_script(
            "document.querySelector('.control-icon-btn.rwd-10sec-icon').click()"
        )
        time.sleep(0.5)
        print("revert")
    print("time " + str(video.get_property("currentTime")))
    wait = WebDriverWait(driver, timeout=20)
    wait.until(lambda driver: video.get_property("currentTime") >= 80)

    wait = WebDriverWait(driver, timeout=5)
    try:
        wait.until(lambda driver: video.get_property("currentTime") >= 106)
        print("✅: Skip Intro/Recap")
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
    except Exception as e:
        print("❌: Skip Credits")
        print("time: " + str(t))
        print(e)


print("Amazon Prime:")
# Amazon_Prime()
# Amazon_PaidContent()
# Amazon_Ad()

print("Netflix:")


print("Disney:")
Disney_Intro()
Disney_Credits()

# driver.quit()
