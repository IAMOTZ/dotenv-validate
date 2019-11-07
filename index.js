
const path = require('path');

let currentEnvironment = null;
let logger = null;

// @todo: I need to validate the content of .evn.validate.js/json/yml
module.exports = (givenEnvVars, config = {}) => {
  const dotenvValidatePath = config.path || path.resolve(process.cwd(), '.env.validate');
  const expectedEnvVars = require(dotenvValidatePath); 

  currentEnvironment = config.currentEnv || process.env.NODE_ENV || 'development';
  console.log('currentEnv not set in options or environment(NODE_ENV), using "development" as default');
  logger = config.logger || console.log;

  validate(givenEnvVars.parsed, expectedEnvVars);
};


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
          logger(message || `Missing required env var ${name}. Defaulting to a value of "${defaultValue}"`);
          process.env[name] = defaultValue;
        } else if (!process.env[name]) throw Error(message || `Missing required env var "${name}". App can't start without it.`);
        break;
      }
      case 2: {
        if (!givenEnvVars[name] && defaultValue) {
          logger(message || `Missing needed env var "${name}". Defaulting to a value of "${defaultValue}"`);
          process.env[name] = defaultValue;
        } else if (!givenEnvVars[name]) logger(message || `Missing needed env var "${name}"`);
        break;
      }
      default: {
        console.log(`Severity level for env var: "${name}" is not set, not sure if it is needed or not`);
      }
    }
  });
}
