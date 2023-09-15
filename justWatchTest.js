async function getMovieInfo(movieTitle) {
  let locale = "en_US";
  const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${movieTitle}","content_types":["show","movie"]}`;
  const response = await fetch(encodeURI(url));
  const data = await response.json();
  //   console.log(data);
  const loc = data.items[0].full_path;
  const opts = { url: `https://www.justwatch.com${loc}` };
  //   console.log(opts);
  //   console.log(data.items[0].offers.filter((x) => x.monetization_type != "flatrate" && x.monetization_type != "rent" && x.monetization_type != "buy"));
  console.log(data.items[0].offers.filter((x) => x.monetization_type == "flatrate" && (x.package_short_name == "amp" || x.package_short_name == "nfx" || x.package_short_name == "dnp")));
}

// let movieTitle = "The Thousand Years of Longing";
// let movieTitle = "Breaking Bad";
let movieTitle = "Elemental";
getMovieInfo(movieTitle);
