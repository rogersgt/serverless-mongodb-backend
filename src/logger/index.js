class Logger {
  error(e) {
    this.log('ERROR: ');
    this.log(e);
  }

  log(content) {
    console.log(content); // eslint-disable-line
  }
}

const logger = new Logger();

export default logger;
