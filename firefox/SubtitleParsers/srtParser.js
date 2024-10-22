// https://raw.githubusercontent.com/1c7/srt-parser-2/refs/heads/master/src/index.ts
// from srt-parser-2
function timestampToSeconds(srtTimestamp) {
  const [rest, millisecondsString] = srtTimestamp.split(",");
  const milliseconds = parseInt(millisecondsString);
  const [hours, minutes, seconds] = rest.split(":").map((x) => parseInt(x));
  const result = milliseconds * 0.001 + seconds + 60 * minutes + 3600 * hours;

  // fix odd JS roundings, e.g. timestamp '00:01:20,460' result is 80.46000000000001
  return Math.round(result * 1000) / 1000;
}

function fixed_str_digit(targetLength, str, padWithZero = true) {
  if (padWithZero) {
    return str.padStart(targetLength, "0");
  } else {
    return str.padEnd(targetLength, "0");
  }
}

function correctFormat(time) {
  // Fix the format if the format is wrong
  // 00:00:28.9670 Become 00:00:28,967
  // 00:00:28.967  Become 00:00:28,967
  // 00:00:28.96   Become 00:00:28,960
  // 00:00:28.9    Become 00:00:28,900

  // 00:00:28,96   Become 00:00:28,960
  // 00:00:28,9    Become 00:00:28,900
  // 00:00:28,0    Become 00:00:28,000
  // 00:00:28,01   Become 00:00:28,010
  // 0:00:10,500   Become 00:00:10,500
  let str = time.replace(".", ",");

  var hour = null;
  var minute = null;
  var second = null;
  var millisecond = null;

  // Handle millisecond
  var [front, ms] = str.split(",");
  millisecond = fixed_str_digit(3, ms);

  // Handle hour
  var [a_hour, a_minute, a_second] = front.split(":");
  hour = fixed_str_digit(2, a_hour, false);
  minute = fixed_str_digit(2, a_minute, false);
  second = fixed_str_digit(2, a_second, false);

  return `${hour}:${minute}:${second},${millisecond}`;
}

function parseSrt(data_array) {
  const items = [];
  for (let i = 0; i < data_array.length; i += 4) {
    const startTime = data_array[i + 1].trim();
    const endTime = data_array[i + 2].trim();
    const new_line = {
      startTime,
      startSeconds: timestampToSeconds(startTime),
      endTime,
      endSeconds: timestampToSeconds(endTime),
      text: data_array[i + 3].trim(),
    };
    items.push(new_line);
  }
  return items;
}
function tryComma(data) {
  data = data.replace(/\r/g, "");
  var regex = /(\d+)\n(\d{1,2}:\d{1,2}:\d{1,2},\d{1,3}) --> (\d{1,2}:\d{1,2}:\d{1,2},\d{1,3})/g;
  let data_array = data.split(regex);
  data_array.shift(); // remove first '' in array
  return data_array;
}
let seperator = ",";
function tryDot(data) {
  data = data.replace(/\r/g, "");
  var regex = /(\d+)\n(\d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3}) --> (\d{1,2}:\d{1,2}:\d{1,2}\.\d{1,3})/g;
  let data_array = data.split(regex);
  data_array.shift(); // remove first '' in array
  seperator = ".";
  return data_array;
}

function fromSrt(data) {
  var originalData = data;
  var data_array = tryComma(originalData);
  if (data_array.length == 0) {
    data_array = tryDot(originalData);
  }

  var items = [];
  for (var i = 0; i < data_array.length; i += 4) {
    const startTime = correctFormat(data_array[i + 1].trim());
    const endTime = correctFormat(data_array[i + 2].trim());
    var new_line = {
      id: data_array[i].trim(),
      startTime,
      startSeconds: timestampToSeconds(startTime),
      endTime,
      endSeconds: timestampToSeconds(endTime),
      text: data_array[i + 3].trim(),
    };
    items.push(new_line);
  }

  return items;
}
