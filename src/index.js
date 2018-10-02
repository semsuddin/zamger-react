import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import Zamger from './Zamger';
import registerServiceWorker from './registerServiceWorker';


ReactDOM.render(
  <Router>
    <Zamger />
  </Router>,
  document.getElementById('root'),
);
registerServiceWorker();
