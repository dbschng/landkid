// @flow
import express from 'express';
import hosts from './hosts';
import ci from './ci';
import personas from './personas';
import { type Env } from './types';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import Queue from './Queue';
import Runner from './Runner';
import routes from './routes';

type Config = {
  port?: number,
  queuePath: string,
  lockPath: string,
  host: $Keys<typeof hosts>,
  hostConfig: {},
  ci: $Keys<typeof ci>,
  ciConfig: {},
  persona?: $Keys<typeof personas>,
};

export default async function atlaskid(config: Config) {
  let server = express();
  let port = config.port || 8000;
  let { queuePath, lockPath } = config;

  server.use(bodyParser.json());
  server.use(morgan('combined'));

  let env: Env = {
    host: await hosts[config.host](config.hostConfig),
    ci: await ci[config.ci](config.ciConfig),
    persona: personas[config.persona || 'goat'],
  };

  let queue = new Queue(queuePath, lockPath);
  let runner = new Runner(queue, env);

  await queue.init();

  routes(server, env, queue, runner);

  return new Promise(resolve => {
    server.listen(port, () => {
      console.log(`Landkid server started at https://localhost:${port}`);
      resolve();
    });
  });
}
