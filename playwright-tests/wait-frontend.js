const http = require('http');
const url = 'http://localhost:5173';
let attempts = 0;
function check(){
  attempts++;
  const req = http.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log('FRONTEND_OK');
      process.exit(0);
    } else if (attempts >= 60) {
      console.error('FRONTEND_NOT_READY');
      process.exit(1);
    } else {
      setTimeout(check, 1000);
    }
  });
  req.on('error', () => {
    if (attempts >= 60) {
      console.error('FRONTEND_NOT_READY');
      process.exit(1);
    } else {
      setTimeout(check, 1000);
    }
  });
}
check();
