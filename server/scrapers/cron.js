const cron = require('node-cron');
const { runScrapers } = require('./runAll');

const DAILY_2AM_IST = '0 2 * * *';

function startScraperCron(options = {}) {
  const logger = options.logger || console;
  const schedule = options.schedule || DAILY_2AM_IST;
  const timezone = options.timezone || 'Asia/Kolkata';

  const task = cron.schedule(schedule, async () => {
    logger.log('[scraper-cron] starting daily price refresh');
    try {
      const summary = await runScrapers(options.runOptions || {});
      logger.log(`[scraper-cron] finished daily price refresh skipped=${summary.skipped}`);
    } catch (err) {
      logger.error(`[scraper-cron] daily price refresh failed: ${err.message}`);
    }
  }, {
    timezone,
  });

  return task;
}

module.exports = {
  DAILY_2AM_IST,
  startScraperCron,
};
