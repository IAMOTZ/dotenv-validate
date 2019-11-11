const path = require('path');
const chalk  = require('chalk');
const exit = require('exit');

let currentEnvironment = null;

const log = {
  warn: (message) => console.warn(`[env-validate][${chalk.bold.keyword('orange')('WARNING')}]: ${message}`),
  error: (message) => console.warn(`[env-validate][${chalk.bold.red('ERROR')}]: ${message}`),
  info: (message) => console.warn(`[env-validate][${chalk.bold.cyanBright('INFO')}]: ${message}`)
}

module.exports = (givenEnvVars, config = {}) => {
  const dotenvValidatePath = config.path || path.resolve(process.cwd(), '.env.validate');

  let expectedEnvVars;

  try {
    expectedEnvVars = require(dotenvValidatePath);
  } catch(error) {
    log.error('Unable to find .env.validate.(js/json) file.');
    log.info('.env.validate.(js/json) should either be in the working directory(cwd) or be specified as "path" in config options. Check the documentation for more details.');
    exit(1);
  } finally {
    if (!expectedEnvVars || expectedEnvVars.constructor.name !== 'Object') {
      log.error(`Invalid validation object, your .env.validate.(js/json) file must be exporting an Object, received ${typeof expectedEnvVars} instead.`);
      exit(1);
    }
  }

  try {  
    currentEnvironment = config.currentEnv || process.env.NODE_ENV || 'development';
    log.warn('currentEnv is not set in config options or environment(NODE_ENV), using the default("development").');
    validate(givenEnvVars, expectedEnvVars);
  } catch (error) {
    if (error.path) {
      log.error('Environment is not valid');
      const message = chalk.red(`${chalk.bold(error.path)}: ${error.message}`);
      log.error(message);
    } else {
      log.error(error.message);
    }
    exit(1);
  }

};

/**
 * @description Compares the given environment vars against the expected environment vars
 * @param {object} givenEnvVars The given environment variables
 * @param {Object} expectedEnvVars The expected environment variables
 */
const validate = (givenEnvVars, expectedEnvVars) => {
  const variableNames = Object.keys(expectedEnvVars);

  variableNames.forEach((name) => {
    if (!expectedEnvVars[name] || expectedEnvVars.constructor.name !== 'Object') throw new InvalidateConfig({ path: name, message: `This value must be an Object, got ${typeof name} instead` });

    const { env } = expectedEnvVars[name];

    let envIsObject = false;

    if (env && env.constructor.name === 'Object') {
      envIsObject = true;
      if (!env[currentEnvironment]) return;
    } else if (Array.isArray(env)) {
      if (!env.includes(currentEnvironment)) return;
    } else throw new InvalidateConfig({ path: `${name}.env`, message: `This value can either be an array or an Object, got ${typeof env} instead.`});

    let {
      severityLevel, message, defaultValue,
    } = expectedEnvVars[name];

    if (envIsObject) {
      ({ severityLevel = severityLevel, defaultValue = defaultValue, message = message } = env[currentEnvironment])
    }


    if(!severityLevel) throw new InvalidateConfig({ path: `${name}.severityLevel`, message: `This value must be a number(1 or 2), got ${typeof severityLevel} instead.`});

    switch (severityLevel) {
      case 1: {
        if (!givenEnvVars[name] && defaultValue) {
          log.warn(message || `Missing required environment variable ${name}. Defaulting to a value of "${defaultValue}".`);
          process.env[name] = defaultValue;
        } else if (!process.env[name]) throw Error(message || `Missing required environment variable: "${name}". App can't start without it.`);
        break;
      }
      case 2: {
        if (!givenEnvVars[name] && defaultValue) {
          log.warn(message || `Missing needed environment variable: "${name}". Defaulting to a value of "${defaultValue}".`);
          process.env[name] = defaultValue;
        } else if (!givenEnvVars[name]) log.warn(message || `Missing needed environment variable: "${name}".`);
        break;
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
