# from selenium import webdriver
# from selenium.webdriver.common.by import By


# def test_eight_components():
#     driver = webdriver.Firefox()

#     driver.get("https://www.selenium.dev/selenium/web/web-form.html")

#     title = driver.title
#     assert title == "Web form"

#     driver.implicitly_wait(0.5)

#     text_box = driver.find_element(by=By.NAME, value="my-text")
#     submit_button = driver.find_element(by=By.CSS_SELECTOR, value="button")

#     text_box.send_keys("Selenium")
#     submit_button.click()

#     message = driver.find_element(by=By.ID, value="message")
#     value = message.text
#     assert value == "Received!"
#     t = False
#     assert t == True
#     driver.quit()


# test_eight_components()


# from selenium import webdriver

# url = "https://mail.google.com"
# options = webdriver.FirefoxOptions()

# # Create a new Firefox profile
# profile = webdriver.FirefoxProfile(
#     "/Users/Marvin/AppData/Roaming/Mozilla/Firefox/Profiles/3sifm4wj.UnitTest"
# )

# # Set preferences for the profile (example)
# profile.set_preference("network.proxy.type", 1)
# profile.set_preference("network.proxy.http", "proxy.example.com")
# profile.set_preference("network.proxy.http_port", 8080)

# # Install add-ons if needed
# # profile.install_addon("/path/to/your/addon.xpi")

# options.profile = profile

# driver = webdriver.Firefox(options=options)
# driver.get(url)
# driver.implicitly_wait(5)
# driver.quit()

from selenium import webdriver
from selenium.webdriver.common.by import By
import time

try:
    # Fire a remote Firefox instance using geckodriver.
    # You need to have Geckodriver in the same directory as the automation testing script OR
    # you need to add it in the "path" environment variable OR
    # you need to know the full path to the geckodriver executable file and use it as:
    # driver = webdriver.Firefox(executable_path=r'your\path\geckodriver.exe')

    driver = webdriver.Firefox()

    # path to your downloaded Firefox addon extension XPI file

    extension_path = "NetflixPrime@Autoskip.io.xpi"

    # using webdriver's install_addon API to install the downloaded Firefox extension

    driver.install_addon(extension_path, temporary=True)

    # Opening the Firefox support page to verify that addon is installed

    driver.get("about:addons")

    # xpath to the section on the support page that lists installed extension
    driver.implicitly_wait(500)
except Exception as E:
    print(E)

finally:
    # exiting the fired Mozilla Firefox selenium webdriver instance

    driver.quit()

    # End Of Script
