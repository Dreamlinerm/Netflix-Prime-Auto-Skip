from selenium import webdriver
from selenium.webdriver.firefox.options import Options


ffOptions = Options()

ffOptions.add_argument("-profile")
ffOptions.add_argument(
    r"C:\Users\Marvin\AppData\Roaming\Mozilla\Firefox\Profiles\fd74ra9i.test"
)
driver = webdriver.Firefox(options=ffOptions)
extension_path = "NetflixPrime@Autoskip.io.xpi"
driver.install_addon(extension_path, temporary=True)
driver.implicitly_wait(500)
driver.quit()
