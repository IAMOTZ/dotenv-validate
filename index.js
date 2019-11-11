const path = require('path');
const chalk  = require('chalk');
const exit = require('exit');

let currentEnvironment = null;

/**
 * @description Default logger
 * @param {string} message The message to log
 */
let log = (message) => console.warn(`[dotenv-validate][WARNING] ${message}`);

module.exports = (givenEnvVars, config = {}) => {
  const dotenvValidatePath = config.path || path.resolve(process.cwd(), '.env.validate');

  let expectedEnvVars;
  try {
    expectedEnvVars = require(dotenvValidatePath);
  } catch(error) {
    console.log('Invalid path to .env.validate');
    // You should either have a .env.validate file at the directory of your package.json or specifity the full path to your .env.validate in config.path
    exit(1);
  }

  try {

    if (!expectedEnvVars || expectedEnvVars.constructor.name !== 'Object') throw new InvalidateConfig('Invalid Validation. Your .env.validate.(js/json) file must be exporting an object');
  
    currentEnvironment = config.currentEnv || process.env.NODE_ENV || 'development';
    console.log('currentEnv not set in options or environment(NODE_ENV), using "development" as default');
    log = config.log || log;
  
    validate(givenEnvVars, expectedEnvVars);
  } catch (error) {
    if (error.path) {
      const message = chalk.red(`${chalk.bold(error.path)}: ${error.message}`);
      console.error(message);
    } else {
      console.log(chalk.red(error));
    }
    exit(1);
  }

};

/**
 * @description Compaires the given environment vars against the expected environment vars
 * @param {object} givenEnvVars The given environment variables
 * @param {Object} expectedEnvVars The expected environment variables
 */
const validate = (givenEnvVars, expectedEnvVars) => {
  const variableNames = Object.keys(expectedEnvVars);

  variableNames.forEach((name) => {
    if (!expectedEnvVars[name] || expectedEnvVars.constructor.name !== 'Object') throw new InvalidateConfig({ path: name, message: 'This value must be an object' });

    const { env } = expectedEnvVars[name];

    let envIsObject = false;

    if (env && env.constructor.name === 'Object') {
      envIsObject = true;
      if (!env[currentEnvironment]) return;
    } else if (Array.isArray(env)) {
      if (!env.includes(currentEnvironment)) return;
    } else throw new InvalidateConfig({ path: `${name}.env`, message: `This value can either be an array or an Object, got ${typeof env} instead`});

    let {
      severityLevel, message, defaultValue,
    } = expectedEnvVars[name];

    if (envIsObject) {
      ({ severityLevel = severityLevel, defaultValue = defaultValue, message = message } = env[currentEnvironment])
    }


    if(!severityLevel) throw new InvalidateConfig({ path: `${name}.severityLevel`, message: 'This value must be a string'});

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

class InvalidateConfig extends Error {
  constructor({ path, message }) {
    super();
    this.path = path;
    this.message = message;
  }
}