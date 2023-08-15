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

## Netflix tests
driver.get("https://www.netflix.com/watch/80011385")
# click on profile-icon class
# driver.find_element(by=By.CLASS_NAME, value="profile-icon").click()
# click on video element
driver.find_element(by=By.CLASS_NAME, value="watch-video--autoplay-blocked").click()

video = driver.find_element(by=By.TAG_NAME, value="video")
print(video)
video.currentTime = 33  # does not work on netflix

driver.quit()
