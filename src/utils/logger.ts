import pino from 'pino'

export const josLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime:'SYS:mm/dd/yyyy  HH:MM:ss.l',
      // messageKey: 'msg',
      include:'level, time', //,hostname,pid,
      singleLine: false,
    }    
  },
  level: 'info', // 'info' | 'debug' | 'trace' | 'warn' | 'error' | 'fatal'
})

// ** Niveles que soporta pino **
// logger.fatal('fatal');
// logger.error('error');
// logger.warn('warn');
// logger.info('info');
// logger.debug('debug');
// logger.trace('trace');

