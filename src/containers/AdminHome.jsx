import React from 'react';
import Api from '../Api';

export default () =>
  <iframe title="admin" width="100%" height="600" src={`https://zamger.etf.unsa.ba/?sta=admin/intro&PHPSESSID=${Api.sessionId}`} />;
