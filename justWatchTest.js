async function getMovieInfo(movieTitle) {
  let locale = "en_US";
  const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${movieTitle}","content_types":["show","movie"]}`;
  const response = await fetch(encodeURI(url));
  const data = await response.json();
  //   console.log(data);
  const justWatchURL = "https://www.justwatch.com" + data.items[0].full_path;
  //   console.log(data.items[0].scoring);
  //   console.log(data.items[0].offers.filter((x) => x.monetization_type != "flatrate" && x.monetization_type != "rent" && x.monetization_type != "buy"));
  //   console.log(data.items[0].offers.filter((x) => x.monetization_type == "flatrate" && (x.package_short_name == "amp" || x.package_short_name == "nfx" || x.package_short_name == "dnp")));
  let offers = data.items[0].offers.filter((x) => x.monetization_type == "flatrate" && (x.package_short_name == "amp" || x.package_short_name == "nfx" || x.package_short_name == "dnp"));
  // get the first offer of each provider
  offers = offers.filter((x, i) => offers.findIndex((y) => y.provider_id == x.provider_id) == i);
  return {
    justWatchURL: justWatchURL,
    scoring: data.items[0].scoring.filter((x) => x.provider_type == "imdb:score")?.[0],
    streamingLinks: offers,
  };
}

// let movieTitle = "The Thousand Years of Longing";
// let movieTitle = "Breaking Bad";
// let movieTitle = "Elemental";

let movieTitle = "Suits"; // both netflix and amazon prime
getMovieInfo(movieTitle).then((infos) => {
  console.log(JSON.stringify(infos));
});
