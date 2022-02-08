import * as _ from 'underscore';
import { SpawnSyncOptions, spawnSync } from 'child_process';

export async function spawnAsync(
  command: string,
  args?: Array<string>,
  options: SpawnSyncOptions = {}
): Promise<string> {
  // Sadly, I can't get the event listeners to work for spawn() so I'm having to use spawnSync().
  // The biggest effect his has is that we don't get live output
  //
  // return await processCommand(command, args);

  let escapedCommand = '';
  let isEscaped = false;
  for (let x = 0; x < command.length; x++) {
    if (command[x] === '"') {
      isEscaped = !isEscaped;
    }

    if (command[x] === ' ' && isEscaped) {
      escapedCommand += ':space:';
    } else {
      escapedCommand += command[x];
    }
  }

  const cmd_args = _.map(escapedCommand.split(' '), (arg) =>
    arg.replace(/:space:/g, ' ')
  ).concat(args);
  const cmd: string = cmd_args.shift() || command;

  const optionString =
    options != undefined ? `\noptions: ${JSON.stringify(options)}` : '';
  const output = `> ${cmd} ${cmd_args.join(' ')}${optionString}\n\n`;
  process.stdout.write(output);

  const child = spawnSync(cmd, cmd_args, {
    shell: true,
    stdio: 'inherit',
    ...options,
  });

  return Promise.resolve(child.output.join('\n'));
}
