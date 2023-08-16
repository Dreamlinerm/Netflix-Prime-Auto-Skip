from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait


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
    # # wait for 2 seconds
    # driver.implicitly_wait(6)

    print(v)
    video = driver.find_element(by=By.XPATH, value=v)
    # assert video time greater than 24
    time = video.get_property("currentTime")
    print("time: " + str(time))
    assert time >= 16
    print("Test passed: Skip Intro")

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
    wait.until(lambda driver: video.get_property("currentTime") < 10)

    time = video.get_property("currentTime")
    print("time: " + str(time))
    assert time < 10
    print("Test passed: Skip Credits")

    # Skip Recap Test
    wait = WebDriverWait(driver, timeout=5)
    wait.until(lambda driver: video.get_property("currentTime") > 0)

    RecapSkipButton = driver.find_element(
        by=By.CSS_SELECTOR, value=".atvwebplayersdk-skipelement-button"
    )
    time = video.get_property("currentTime")
    print("time: " + str(time))
    assert time >= 37
    print("Test passed: Skip Recap")
    driver.close()


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
    wait.until(lambda driver: video.get_property("currentTime") > time)
    print("Test passed: Skip Ad")
    driver.close()


# Amazon_Prime()
Amazon_Ad()
# driver.quit()
