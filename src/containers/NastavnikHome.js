import React from 'react';
import Api from '../Api';

export default () =>
    <iframe width="100%" height="600" src={ "https://zamger.etf.unsa.ba/?sta=saradnik/intro&PHPSESSID="+Api.sessionId}></iframe>
;
