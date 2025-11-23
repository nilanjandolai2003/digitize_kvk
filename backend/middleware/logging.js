const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const development = morgan('dev');

const production = morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' })
});

module.exports = { development, production };