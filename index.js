const restify = require('restify');
const moment = require('moment');
const request = require('request-promise-native').defaults({ jar: true });
const logger = require('./logger');
const { time } = require('./helpers');
const config = require('./env');

const consoleConfig = { ...config, PASSWORD: '[REDACTED]' };
logger.info('environment variables:\n', consoleConfig);

// api settings
const server = restify.createServer();
server.server.setTimeout(config.SERVER_TIMEOUT);
server.use(restify.plugins.queryParser({ mapParams: false }));

// some handling
server.on('error', (err) => {
	logger.error('server encountered an error', err);
	process.exit(1); // if in docker it should be restarted automatically
});

// router
server.get('/info', async (req, res) => {
	const startDateTime = moment();
	logger.logRequest('isp-scarlet-usage-api.info.login');

	try {
		// post login page with credentials to get user cookies, they will be put in the jar (default enabled)
		await getLoggedinCookies();

		const statusPage = await getStatusPage();
		const usage = statusPage.match(/(Math\.round\()([0-9]+\.[0-9]+)/g);

		if (usage && usage.length > 1) {
			const parsedUsage = usage.map(str => str.replace('Math.round(', ''));
			const daysUntillReset = statusPage.match(/([0-9]{1,2})( dag\(en\))/g)[0].replace(' dag(en)', '');
			logger.info(`current use: ${parsedUsage[0]} / ${parsedUsage[1]} GB, ${daysUntillReset} days until reset`);

			const endDateTime = moment();
			logger.debug(`processing took ${time(startDateTime, endDateTime)}`);
			res.send({ usage: parseFloat(parsedUsage[0]), limit: parseFloat(parsedUsage[1]), daysUntillReset: parseInt(daysUntillReset) });
		} else {
			res.send(500, { code: 500, message: 'could not parse usage, something went wrong with fetching the page' });
		}
	} catch (err) {
		logger.error(err);
		res.send(500, { code: 500, message: `an internal error occurred ${err}` });
	}
});

server.listen(config.SERVER_PORT, () => {
	logger.info(`scarlet-usage-api listening on port ${config.SERVER_PORT}`);
});

function getLoggedinCookies() {
	return request({
		url: 'https://www.scarlet.be/customercare/logon.do',
		method: 'POST',
		form: { username: config.USERNAME, password: config.PASSWORD }
	})
	.then((page) => {
		logger.debug('retreived logged in session cookies');
		return page;
	})
	.catch((err) => {
		logger.error('could not retreive logged in session cookies', err);
		throw new Error('could not retreive logged in session cookies');
	});
}

function getStatusPage() {
	return request({
		url: 'https://www.scarlet.be/customercare/usage/dispatch.do',
		method: 'GET'
	})
	.then((page) => {
		logger.debug('retreived new session cookies');
		return page;
	})
	.catch((err) => {
		logger.error('rould not retreive new session cookies', err);
		throw new Error('rould not retreive new session cookies');
	});
}
