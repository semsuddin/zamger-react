import config from './config';

const Api = {
  sessionId: '',
  isLoggedIn: true,
  person: {},

  login(username, password) {
    const params = {
      login: username,
      pass: password,
    };
    const self = this;
    return new Promise((resolve, reject) => {
      self.requestPost('auth', params)
        .then(res => res.json())
        .then((response) => {
          if (response.success !== 'true') {
            reject(response);
          } else {
            document.cookie = `zamger-session-id=${response.sid}; path=/`;
            self.sessionId = response.sid;
            self.isLoggedIn = true;
            resolve(response);
          }
        }).catch((error) => {
          console.log('auth request failed');
          reject(error);
        });
    });
  },

  logout() {
    document.cookie = 'zamger-session-id=; path=/';
    this.isLoggedIn = false;
    this.sessionId = '';
  },


  // Check if session cookie is present
  checkCookie() {
    const cookiestr = 'zamger-session-id=';
    const x = document.cookie.indexOf(cookiestr);
    if (x >= 0) {
      let y = document.cookie.indexOf(';', x + 1);
      if (y === -1) y = document.cookie.length;
      this.sessionId = document.cookie.substring(x + cookiestr.length, y);
      this.isLoggedIn = true;
    } else {
      this.isLoggedIn = false;
    }
  },


  // Api request to get info on currently logged in person
  getPerson() {
    const self = this;
    return new Promise((resolve, reject) => {
      self.request('person')
        .then((response) => {
          console.log('Person success');
          if (response.status === 401) {
            self.isLoggedIn = false;
            self.sessionId = '';
            console.log('Not logged in');
            resolve({});
          } else {
            const person = response.json();
            self.person = person;
            resolve(person);
          }
        })
        .catch((error) => {
          console.log('person request failed');
          resolve({});
        });
    });
  },


  checkPrivilege(person, privilege) {
    if (!person || !person.privileges) return false;
    return person.privileges.includes(privilege);
  },


  // Api request using POST method (with params)
  requestPost(relativeUrl, params) {
    let url = relativeUrl;
    if (url.includes('?')) url += '&'; else url += '?';
    url += 'SESSION_ID=' + this.sessionId;

    const fetchOptions = {
      body: JSON.stringify(params),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    };
    return new Promise((resolve, reject) => {
      fetch(config.zamger.apiBaseUrl + relativeUrl, fetchOptions).then((response) => {
        resolve(response);
      }).catch((error) => {
        console.log('fetch() operation failed');
        reject(error);
      });
    });
  },


  // Api request using GET method (caller must handle status response)
  request(relativeUrl) {
    // Adding session ID to URL...
    let url = relativeUrl;
    if (url.includes('?')) url += '&'; else url += '?';
    url += 'SESSION_ID=' + this.sessionId;

    return new Promise((resolve, reject) => {
      fetch(config.zamger.apiBaseUrl + relativeUrl).then((response) => {
        console.log('fetch() operation succeeded');
        resolve(response);
      }).catch((error) => {
        console.log('fetch() operation failed');
        reject(error);
      });
    });
  },


  // A very common type of GET request where result is decoded as JSON and the only
  // allowed response status code is 200
  requestJson(relativeUrl) {
    return Api.request(relativeUrl).then((result) => {
      if (result.status === 200) {
        const res = result.json();
        return res;
      }
      console.log(`Unexpected response to ${relativeUrl}`);
      console.log(result);
      throw new Error(`Status ${result.status}`);
    });
  },
};

export default Api;
