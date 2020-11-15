const waitForDOM = function (wrapper, selector) {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const userEl = wrapper.findAll(selector);
      if (userEl.length > 0) {
        clearInterval(timer);
        resolve();
      }
    }, 100);
  });
};

const waitFor = function (callback) {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (callback()) {
        clearInterval(timer);
        resolve();
      }
    }, 5);
  });
};

const waitForTick = function (Vue, callback) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    let maxAttempts = 200;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      await Vue.$nextTick();
      if (callback()) {
        resolve();
      }
    }
  });
};

const fixTextSpacing = function (text) {
  return text.replace(/\s\s+/g, ' ');
};

export { waitForDOM, waitFor, waitForTick, fixTextSpacing };