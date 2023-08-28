'use strict';

function get(url, requestImpl = new XMLHttpRequest()) {
  return new Promise((resolve, reject) => {
    requestImpl.onreadystatechange = function () {
      if (requestImpl.readyState == 4) {
        if (requestImpl.status == 200) {
          resolve(requestImpl.responseText);
        } else {
          reject(
            new Error(
              `Failed with status ${requestImpl.status} for url=${url}`,
            ),
          );
        }
      }
    };

    requestImpl.open('GET', url, true);
    requestImpl.send(null);
  });
}

function post(url, body, requestImpl = new XMLHttpRequest()) {
  return new Promise((resolve, reject) => {
    requestImpl.onreadystatechange = function () {
      if (requestImpl.readyState == 4) {
        if (requestImpl.status == 200) {
          resolve(requestImpl.responseText);
        } else {
          reject(
            new Error(
              `Failed with status ${requestImpl.status} for url=${url} body=${body}`,
            ),
          );
        }
      }
    };

    requestImpl.open('POST', url, true);
    requestImpl.setRequestHeader('Content-type', 'application/json');
    requestImpl.send(body);
  });
}

module.exports = {
  get,
  post,
};
