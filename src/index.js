/* eslint-disable no-console */

import path from 'path'
import chalk from 'chalk'
import defaults from 'lodash/defaults'
import detectPort from 'detect-port'
import clearConsole from 'react-dev-utils/clearConsole'
import prompt from 'react-dev-utils/prompt'
import openBrowser from 'react-dev-utils/openBrowser'
import WebpackDevServer from 'webpack-dev-server'
import createCompiler from './createCompiler'
import includeClientEntry from './includeClientEntry'

const setup = params => {
  if (!params.config) {
    console.log(chalk.red('webpack config is missing.'))
    return
  }

  const options = defaults(params, {
    port: process.env.PORT || 8080,
    hostname: process.env.HOSTNAME || 'localhost',
    https: false,
    publicPath: params.config.output.publicPath,
  })

  const config = includeClientEntry(options.config)

  detectPort(options.port).then(alternativePort => {
    if (alternativePort === options.port) {
      return options.port
    }

    return prompt(chalk.yellow(
      `Something is already running on port ${options.port}. \n` +
      `Use port ${alternativePort} instead?`
    ), true).then(useAlternative => {
      if (useAlternative) {
        return alternativePort
      }

      return false
    })
  })
  .then(port => {
    if (port) {
      const url = `${options.https ? 'https' : 'http'}://${options.hostname}:${port}`
      const compiler = createCompiler(config, url)
      const devServer = new WebpackDevServer(compiler, {
        clientLogLevel: 'none',
        hot: true,
        quiet: true,
        publicPath: options.publicPath,
        contentBase: path.resolve('public'),
        https: options.https,
        watchOptions: {
          ignored: /node_modules/,
        },
      })

      if (options.middleware) {
        devServer.use(options.middleware)
      }

      devServer.listen(port, error => {
        if (error) {
          console.log(error)
          return
        }

        clearConsole()
        openBrowser(url)
        console.log('Starting dev server')
      })
    }
  })
}

export default setup
