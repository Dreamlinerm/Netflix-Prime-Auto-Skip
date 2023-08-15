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


from selenium import webdriver

url = "https://mail.google.com"
options = webdriver.FirefoxOptions()

# Create a new Firefox profile
profile = webdriver.FirefoxProfile(
    "/Users/Marvin/AppData/Roaming/Mozilla/Firefox/Profiles/fd74ra9i.test"
)

# Set preferences for the profile (example)
profile.set_preference("network.proxy.type", 1)
profile.set_preference("network.proxy.http", "proxy.example.com")
profile.set_preference("network.proxy.http_port", 8080)

# Install add-ons if needed
# profile.install_addon("/path/to/your/addon.xpi")

options.profile = profile

driver = webdriver.Firefox(options=options)
driver.get(url)
driver.quit()
