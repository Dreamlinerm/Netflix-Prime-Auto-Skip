async function getMovieInfo(movieTitle) {
  let locale = "en_US";
  const url = `https://apis.justwatch.com/content/titles/${locale}/popular?language=en&body={"page_size":1,"page":1,"query":"${movieTitle}","content_types":["show","movie"]}`;
  const response = await fetch(encodeURI(url));
  const data = await response.json();
  console.log(data);
  const loc = data.items[0].full_path;
  const opts = { url: `https://www.justwatch.com${loc}` };
  console.log(opts);
}

let movieTitle = "Three Thousand Years of Longing";
getMovieInfo(movieTitle);
