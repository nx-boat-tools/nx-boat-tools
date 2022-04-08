import * as _ from 'underscore';
import * as readline from 'readline';
import { SpawnSyncOptions, spawn, spawnSync } from 'child_process';

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

export async function spawnDetached(
  command: string,
  args?: Array<string>,
  options: SpawnSyncOptions = {},
  allowContinue = true
): Promise<string> {
  return new Promise((res, rej) => {
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

    const child = spawn(cmd, cmd_args, {
      shell: true,
      stdio: 'inherit',
      ...options,
    });

    const childOutput: Array<string> = [];

    child.stdout?.on('data', (data) => {
      childOutput.push(Buffer.from(data, 'utf-8').toString());
    });

    child.stderr?.on('data', (data) => {
      childOutput.push(Buffer.from(data, 'utf-8').toString());
    });

    child.on('close', (code) => {
      if (code !== null && code > 0) {
        rej(childOutput.join('\n'));
      } else {
        res(childOutput.join('\n'));
      }
      return;
    });

    const prompt = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    prompt.question(`Press ENTER to stop running...\n\n`, () => {
      console.log('🛑 Stopping...');
      prompt.close();

      child.kill('SIGINT');

      if (!allowContinue) {
        process.emit('SIGINT');
      }
    });
  });
}
