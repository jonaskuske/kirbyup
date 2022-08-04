import { cac } from 'cac'
import consola from 'consola'
import { name, version } from '../../package.json'
import { build, serve } from './index'

export async function startCli(cwd = process.cwd(), argv = process.argv) {
  const cli = cac(name)

  cli
    .command('<file>', 'Compile the panel plugin to index.js and index.css')
    .option('-d, --out-dir <dir>', 'Output directory', { default: cwd })
    .option(
      '-w, --watch [path]',
      'Watch for file changes. If no path is specified, the folder of the input file will be watched',
      { default: false },
    )
    .example('kirbyup src/index.js')
    .example('kirbyup src/index.js --out-dir ~/kirby-site/site/plugins/demo')
    .example('kirbyup src/index.js --watch src/**/*.{js,css} --watch assets/*\n')
    .action(async (file: string, options: { outDir: string; watch: boolean | string | string[] }) => {
      await build({ cwd, entry: file, ...options })
    })

  cli
    .command('serve <file>', 'Start development server with live reload')
    .option('--no-watch', 'Don\'t watch .php files for changes', { default: '\0' })
    .option('-w, --watch <path>', 'Watch additional files', { default: './**/*.php' })
    .example('kirbyup serve src/index.js')
    .example('kirbyup serve src/index.js --no-watch')
    .example('kirbyup serve src/index.js --watch snippets/*.php --watch templates/*.php\n')
    .action(async (file: string, options: { watch: false | string | string[] }) => {
      const server = await serve({ cwd, entry: file, ...options })

      const close = () => server.httpServer?.listening && server.close()

      process.on('SIGINT', () => close())
      process.on('exit', () => close())
      process.on('uncaughtException', (err) => {
        consola.error(err)
        process.exitCode = 1
        close()
      })
    })

  // Filter out unnecessary "default" output for negated options (zerobyte acts as marker)
  cli.help(s => s.map(msg => ({ ...msg, body: msg.body.replace(' (default: \0)', '') })))
  cli.version(version)

  // Parse CLI args without running the command to
  // handle command errors globally
  cli.parse(argv, { run: false })
  await cli.runMatchedCommand()
}

