function formatTime(number) {
    return number < 10 ? '0' + number : number;
}

let now = new Date();
let hours = formatTime(now.getHours());
let minutes = formatTime(now.getMinutes());
let seconds = formatTime(now.getSeconds());

console.log(`Current Time: ${hours}:${minutes}:${seconds}`);