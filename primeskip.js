/*
Just draw a border round the document.body.
*/
document.body.style.border = "5px solid red";
var url = window.location;
// var path = window.location.pathname;
// test url with regex for video
var isVideo = /video|Safari/i.test(url);
// alert(url + "\n" + isVideo);

var aTags = document.getElementsByTagName("button");
var searchText = new RegExp("Skip", "i");
var found;

// for (var i = 0; i < aTags.length; i++) {
//   if (searchText.test(aTags[i].textContent)) {
//     found = aTags[i];
//     break;
//   }
// }
for (const Tag of aTags) {
  if (searchText.test(Tag.textContent)) {
    found = Tag;
    break;
  }
}
found.click();
alert(found.textContent);
// Use `found`.
