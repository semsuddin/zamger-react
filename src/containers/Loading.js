import React from 'react';
import { Loader, Container } from 'semantic-ui-react';

export default () =>
    <Container text style={{ marginTop: '7em' }}>
		<Loader active inline='centered'>Pokrećem Zamger...</Loader>
	</Container>
;
