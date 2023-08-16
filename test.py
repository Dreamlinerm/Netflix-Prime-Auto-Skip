from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By


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
v = "//video[not(@preload='auto')]"
print(v)
video = driver.find_element(by=By.XPATH, value=v)
# assert video time greater than 24
time = video.get_property("currentTime")
print("time: " + str(time))
assert time > 22
# driver.quit()
