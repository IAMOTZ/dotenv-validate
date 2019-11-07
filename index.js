const path = require('path');

let currentEnvironment = null;

/**
 * @description Default logger
 * @param {string} message The message to log
 */
let log = (message) => console.warn(`[dotenv-validate][WARNING] ${message}`);

module.exports = (givenEnvVars, config = {}) => {
  const dotenvValidatePath = config.path || path.resolve(process.cwd(), '.env.validate');
  // @todo: I need to validate the content of .evn.validate.js/json
  const expectedEnvVars = require(dotenvValidatePath); 

  currentEnvironment = config.currentEnv || process.env.NODE_ENV || 'development';
  console.log('currentEnv not set in options or environment(NODE_ENV), using "development" as default');
  log = config.log || log;

  validate(givenEnvVars.parsed, expectedEnvVars);
};

/**
 * @description Compaires the given environment vars against the expected environment vars
 * @param {object} givenEnvVars The given environment variables
 * @param {Object} expectedEnvVars The expected environment variables
 */
const validate = (givenEnvVars, expectedEnvVars) => {
  const variableNames = Object.keys(expectedEnvVars);

  variableNames.forEach((name) => {
    const { env } = expectedEnvVars[name];

    let envIsObject = false;

    if (env.constructor.name === 'Object') {
      envIsObject = true;
      if(!env[currentEnvironment]) return;
    } else {
      if (!env.includes(currentEnvironment)) return;
    }

    let {
      severityLevel, message, defaultValue,
    } = expectedEnvVars[name];
  
    if(envIsObject) {
      ({ severityLevel = severityLevel, defaultValue = defaultValue, message = message } = env[currentEnvironment])
    }

    switch (severityLevel) {
      case 1: {
        if (!givenEnvVars[name] && defaultValue) {
          log(message || `Missing required env var ${name}. Defaulting to a value of "${defaultValue}"`);
          process.env[name] = defaultValue;
        } else if (!process.env[name]) throw Error(message || `Missing required env var "${name}". App can't start without it.`);
        break;
      }
      case 2: {
        if (!givenEnvVars[name] && defaultValue) {
          log(message || `Missing needed env var "${name}". Defaulting to a value of "${defaultValue}"`);
          process.env[name] = defaultValue;
        } else if (!givenEnvVars[name]) log(message || `Missing needed env var "${name}"`);
        break;
      }
      default: {
        console.log(`Severity level for env var: "${name}" is not set, not sure if it is needed or not`);
      }
    }
  });
}
