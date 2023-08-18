title = "How I Met Your Mother";
title = title.replaceAll(" ", "%20");
const url = "https://moviesdatabase.p.rapidapi.com/titles/search/title/" + title + "?exact=true&info=base_info";
const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": "3798a400e8mshced4564d240d851p1b4f85jsn717e097775dd",
    "X-RapidAPI-Host": "moviesdatabase.p.rapidapi.com",
  },
};

try {
  fetch(url, options)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    })
    .then((text) => {
      console.log(text);
    })
    .catch((error) => {
      console.error(error);
    });
} catch (error) {
  console.error(error);
}
