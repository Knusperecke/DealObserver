'use strict';

function get(url, requestImpl = new XMLHttpRequest()) {
    return new Promise((resolve, reject) => {
        requestImpl.onreadystatechange = function() {
            if (requestImpl.readyState == 4) {
                if (requestImpl.status == 200) {
                    resolve(requestImpl.responseText);

                } else {
                    reject(new Error('Failed with status ' + requestImpl.status));
                }
            }
        };

        requestImpl.open('GET', url, true);
        requestImpl.send(null);
    });
}

module.exports = {get};