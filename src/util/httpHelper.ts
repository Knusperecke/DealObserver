export type HttpGetFunction = (
  url: string,
  requestImpl: XMLHttpRequest,
) => Promise<string>;
export function get(
  url: string,
  requestImpl = new XMLHttpRequest(),
): Promise<string> {
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

export type HttpPostFunction = (
  url: string,
  body: Document | XMLHttpRequestBodyInit,
  requestImpl: XMLHttpRequest,
) => Promise<string>;
export function post(
  url: string,
  body: Document | XMLHttpRequestBodyInit,
  requestImpl = new XMLHttpRequest(),
): Promise<string> {
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
