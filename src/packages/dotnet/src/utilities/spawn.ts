import { spawn, spawnSync } from 'child_process';
import * as _ from 'underscore';

export async function spawnAsync(command: string, args?: any): Promise<string> {
    // Sadly, I can't get the event listeners to work for spawn() so I'm having to use spawnSync().
    // The biggest effect his has is that we don't get live output
    //
    // return await processCommand(command, args);

    let escapedCommand = '';
    let isEscaped = false;
    for(let x=0; x<command.length; x++) {
        if(command[x] === '"') {
            isEscaped = !isEscaped;
        }

        if(command[x] === ' ' && isEscaped) {
            escapedCommand += ':space:';
        } else {
            escapedCommand += command[x];
        }
    }

    const cmd_args = _.map(escapedCommand.split(' '), arg => arg.replace(/\:space\:/g, ' ')).concat(args);
    const cmd: string = cmd_args.shift() || command;

    let output = `> ${cmd} ${cmd_args.join(' ')}\n\n`;
    process.stdout.write(output);

    const child = spawnSync(cmd, cmd_args, { shell: true })

    return Promise.resolve(child.output.join('\n'))
}

function processCommand(command: string, args?: any): Promise<string> {
    return new Promise<string>(
        (resolve, reject): void => {
            let escapedCommand = '';
            let isEscaped = false;
            for(let x=0; x<command.length; x++) {
                if(command[x] === '"') {
                    isEscaped = !isEscaped;
                }

                if(command[x] === ' ' && isEscaped) {
                    escapedCommand += ':space:';
                } else {
                    escapedCommand += command[x];
                }
            }

            const cmd_args = _.map(escapedCommand.split(' '), arg => arg.replace(/\:space\:/g, ' ')).concat(args);
            const cmd: string = cmd_args.shift() || command;

            let output = `> ${cmd} ${cmd_args.join(' ')}\n\n`;
            process.stdout.write(output);

            const child = spawn(cmd, cmd_args, { stdio: 'inherit', shell: true });

            child.stderr.on('data', (err: string) => {
                process.stdout.write('err_data\n');
                process.stderr.write(err.toString());

                output += err;
            });
            
            child.stdout.on('data', (chunk: string) => {
                process.stdout.write('out_data\n');
                process.stdout.write(chunk.toString());

                output += chunk;
            });

            child.on('close', (code: number) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(output);
                }
            });
        }
    );
}
