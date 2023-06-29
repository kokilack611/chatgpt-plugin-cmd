//Author: Anoop, http://github.com/etherlegend

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { json } from 'body-parser';

import { spawn } from 'child_process';
import bodyParser from 'body-parser';

const app = express();

app.use(cors({
  origin: 'https://chat.openai.com'
}));
app.use(json());
app.use(bodyParser.json()); // for parsing application/json

// @ts-ignore
let shell;

// API endpoint to spawn a new shell
app.post('/spawn', (req, res) => {
  try {
    shell = spawn('cmd');
    shell.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    shell.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    shell.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
    });
    res.status(200).send('Spawned a new shell');
  } catch (error) {
    console.error(`Error spawning shell: ${error}`);
    // @ts-ignore
    res.status(500).send(`Error spawning shell: ${error.message}`);
  }
});

// API endpoint to run a command
app.post('/run', async (req, res) => {
  const command = req.body.command;

  // @ts-ignore
  if (shell) {
    let output = '';

    // @ts-ignore
    shell.stdout.on('data', (data) => {
      output += data;
    });

    // @ts-ignore
    shell.stderr.on('data', (data) => {
      output += data;
    });

    shell.stdin.write(`${command}\n`);
    shell.stdin.end();

    shell.on('close', (code:any) => {
      res.status(200).send(output);
    });
  } else {
    res.status(400).send('No shell is running');
  }
});


// API endpoint to exit the shell
app.post('/exit', (req, res) => {
  // @ts-ignore
  if (shell) {
    shell.stdin.write('exit\n');
    res.status(200).send('OK');
  } else {
    res.send('No shell is running');
  }
});

app.get('/logo.png', async (_, res) => {
  const filename = 'logo.png';
  res.sendFile(filename, { root: '.' });
});

app.get('/.well-known/ai-plugin.json', async (_, res) => {
  fs.readFile('./.well-known/ai-plugin.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(data);
  });
});

app.get('/openapi.yaml', async (_, res) => {
  fs.readFile('openapi.yaml', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error');
      return;
    }
    res.setHeader('Content-Type', 'text/yaml');
    res.status(200).send(data);
  });
});

const main = () => {
  app.listen(5003, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:5003');
  });
};

main();
