module.exports = function (config) {
  config.set({
    plugins: [
      "karma-webpack",
      "karma-jasmine",
      "karma-firefox-launcher",
      // Adding it to the plugins array
      "karma-chrome-launcher",
    ],
    // I'm starting a headless browser, but I can also swap this out for "Chrome" to add debug statements, inspect console logs etc.
    browsers: ["Firefox", "FirefoxDeveloper", "FirefoxNightly", "Chrome"],
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    // Here I'm including all of the the Jest tests which are all under the __tests__ directory.
    // You may need to tweak this patter to find your test files/
    files: ["./scripts/karma-setup.js", "packages/*/__tests__/**/*.ts"],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "./karma-setup.js": ["webpack"],
      // Use webpack to bundle our tests files
      "packages/*/__tests__/**/*.ts": ["webpack"],
    },
  });
};
