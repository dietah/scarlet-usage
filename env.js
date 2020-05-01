const envalid = require('envalid'); // eslint-disable-line object-curly-newline

/* eslint-disable key-spacing */

module.exports = envalid.cleanEnv(process.env, {
	LOG_LEVEL: 		envalid.str({ choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'], default: 'DEBUG', devDefault: 'DEBUG' }),

	SERVER_PORT: 	envalid.port({ default: 3002, desc: 'The port on which to expose the HTTP server' }),
	SERVER_TIMEOUT: envalid.num({ default: 2 * 60 * 1000, desc: 'Global response timeout for incoming HTTP calls' }),

	USERNAME:		envalid.str({ desc: 'Scarlet username' }),
	PASSWORD:		envalid.str({ desc: 'Scarlet password' }),
}, {
	strict: true
});
