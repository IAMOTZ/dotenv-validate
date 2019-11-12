# env-validate  
 
> A package to help you validate your environment variables.

More than often, your applications would rely on environment variables to do one thing or the other. As your project grows, it is very likely that the number of environment variables it uses also grows, ensuring that these variables are available in a given environment type even before running your application in that environment is very important to avoid run time errors/issues that can have serious impact on user satisfaction.

`env-validate` helps you to:
- Ensure that you application won't start if any environment variable **required** for the app to run is not set in the current environment. 
- Ensure that you are well informed via warning messages if any environment variable **needed**(but not required) for the app to run is not set in the current environment. 
- Set default values for environment variables that are not set in a particular environment. This helps to avoid setting defaults withing application code which is not something very nice to do.
- `env-validate` also takes into consideration that the same environment variable might behave differently in different environment, for example, an environment variable `APP_NAME` might be required in "production" environment but optional in "development" environment.


## Installation
```  
# With NPM
npm install env-validate

# With Yarn
yarn add env-validate
```

## Usage
You should validate your environment variables as early as possible in your application.
- Import/require and use the `env-validate` package. The `env-validate` package exports a function that accepts two parameters, the environment variables(`process.env`) and an optional configuration object, more about the configuration object [here]().

```
const envValidate = require('env-validate');
envValidate(process.env, {});

# ES6 importing
import envValidate from 'env-validate';
envValidate(process.env, config);

# If you are using dotenv to load your environment variables, you need to ensure the environment variables are loaded before running the validation
# For example:
const dotenv = require('dotenv').config() // Load the environment variables
const envValidate = require('env-validate');
envValidate(process.env);
```

- Create a `.env.validate.(js/json)` file(can either be `.js` or `.json`) in the root directory of your project, this file should export the validation object, the validation object is just a normal javascript object where you specify how each environment variables should be validated. More about the validation object [here]().


### Validation Object
The `.env.validate.(js/json)` file must export an Object such that each entry key in the object is the name of a expected environment variable while the value of the key is an Object describing how the environment variable should validated, something like this:

```
{
  ENV_VAR_NAME: {
    severityLevel: 1 or 2
    env: Array of Object
    defaultValue: '',
    message: '',
  },
} 
```
#### `ENV_VAR_NAME.severityLevel`

This describes how important this environment variable is. It **must** be provided and can either be 1(required) or 2(needed). Warning messages would be logged when an environment variable with severity level of 2 is not present. App would exit(with exit code of 1) if environment variable with a severity level of 1 is not present. e.g
```
{
  ENV_VAR_A: {
    severityLevel: 1, // Application won't exit if this environment variable is not set
  },
  ENV_VAR_B: {
    severityLevel: 2, // Warning messages would be logged to the terminal if this environment variable is not set
  },
} 
```

####  `ENV_VAR_NAME.env`
This describes the environments where you want validation to execute for this environment variable. The current environment can either be set in the config object, or as environment variable NODE_ENV. If `env-validate` can't find deduce the current environment from the config options or from NODE_ENV environment variable, it would use the default("development"). This field is required and the value can either be an Array or an Object.

You should use an object if the environment variable would be validated differently in different environments e.g:
```
{
 // This env var is validated such that it is optional in development and required in production environment
 // This environment variable won't be validated if config.currentEnv or NODE_ENV is not "development" and is not "production"
  ENV_VAR_NAME: {
    env: {
        'development': {
          severityLevel: 2,
        },
        'production': {
          severityLevel: 1,
        }
    }
  },
} 
```
You should use an Array if the environment variable would be validated the same way across the different environments
 
```
{
  ENV_VAR_NAME: {
    env: ['test', 'development', 'production'\
  },
} 
```

####  `ENV_VAR_NAME.defaultValue`
 A default value to set for the environment variable if it is not available. This field is optional and the value must be a string e.g
```
{
 // If ENV_VAR_NAME is not in process.env, it would be set to 'some-value'
  ENV_VAR_NAME: {
    defaultValue: 'some-value'
  },
} 
```

####  `ENV_VAR_NAME.message`
The message to log if this environment variable is not set. By default, `env-validate` would log warning or error messages to the terminal if an environment variable is not set, you can use this field to ensure your own custom message is logged
```
{
 // If ENV_VAR_NAME is not in process.env, it would be set to 'some-value'
  ENV_VAR_NAME: {
    message: 'ENV_VAR_NAME is required to run this app, reach out to helpdesk to get yours.'
  },
} 
```

### Sample `.env.validation.js`
```
module.exports = {
  VAR_A: {
    severityLevel: 1,
    env: ['test', 'development', 'production'],
  },
  VAR_B: {
    severityLevel: 2, // Default severity level
    env: {
      'production': {
        severityLevel: 1, // This environment var is required in production
        defaultValue: 'var-b-prod', // If the environment var is not set, it defaults to 'var-b-prod' in production environment
      },
      'test': { // The severitiyLevel in test environment is same as the default(2)
        defaultValue: 'var-b-test', // If the environment var is not set, it defaults to 'var-b-prod' in test environment
      }
    }
  },
  VAR_C: {
    severityLevel: 2,
    env: ['test'],
    message: 'Test can execute without VAR_C, please contat helpdesk for more info',
  },
}
```

## Config Object  

You can pass some configuration options when calling the validate function: 
### config.path 
By default `env-valdiate` would look for the `.env.validate.(js/josn)` file in the working directory of the project, however, you can use this option to manualy specify the full path to the file e.g

```
const envValidate = require('env-validate');
envValidate(process.env, {
  path: '/full/path/to/file/exporting/validation/object'
});
```

### config.currentEnv
By default, `env-validate` would try to get the current environment from `NODE_ENV` environment variable, however, you can use this option to manauly specify the current environment e.g if it is stored in a different environment variable;
```
const envValidate = require('env-validate');
envValidate(process.env, {
  currentEnv: process.env.CURRENT_ENV // Where CURRENT_ENV is an enviroment variable telling the current environment
});
```
Note that if both `NODE_ENV` and `config.currentEnv` is not set, `env-validate` would use a default environmetn which is `development`.

## Contribution
If you think there is anything that can get better in this project, please feel free to raise a Pull Request. To contribute to this project:
- Fork this repository
- Create a new branch for your contribution on the forked repo
- Commit your changes with detailed commit messages
- Raise a pull request from your forked repo against the master branch of this repo


### What can you develop?
- Since the `.env.validate.(js/json)` have an exact knowledge of all the expected environment variables across different environment types, I think it would be nice to be able to configure `env-validate` to auto generate a `.env.example` file.
- It would also be nice to have users use theri custom loggers to replace the `console` I'm using internally for logging info, warning and error message
- I am also yet to write any unit tests, any help on that would be appreciated.
Just like I said in the contribution section, if you think there is anything that can get better in this project, please feel free to raise a Pull Request or engage me via Github Issues.