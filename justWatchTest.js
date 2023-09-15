async function getMovieInfo(movieTitle) {
  let locale = "en_US";
  const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${movieTitle}","content_types":["show","movie"]}`;
  const response = await fetch(encodeURI(url));
  const data = await response.json();
  const justWatchURL = "https://www.justwatch.com" + data.items[0].full_path;
  // flatrate = free with subscription (netflix, amazon prime, disney+)
  let offers = data.items[0].offers.filter((x) => x.monetization_type == "flatrate" && (x.package_short_name == "amp" || x.package_short_name == "nfx" || x.package_short_name == "dnp"));
  // get the first offer of each provider
  offers = offers.filter((x, i) => offers.findIndex((y) => y.provider_id == x.provider_id) == i);
  return {
    justWatchURL: justWatchURL,
    scoring: data.items[0].scoring.filter((x) => x.provider_type == "imdb:score")?.[0],
    streamingLinks: offers,
  };
}
let movieTitle;
movieTitle = "The Thousand Years of Longing"; // not on amp.de but on amp.com
movieTitle = "Breaking Bad"; // on netflix
movieTitle = "Elemental"; // on dnp

movieTitle = "Suits"; // both netflix and amazon prime
getMovieInfo(movieTitle).then((infos) => {
  console.log(JSON.stringify(infos));
});
