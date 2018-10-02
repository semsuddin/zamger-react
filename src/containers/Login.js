import React, { Component } from 'react';
import { Icon, Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import logo from '../etf-logo.svg';
import Api from '../Api';

class Login extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  constructor(props){
    console.log("login ctor");
    super(props);
    this.state={
      username:'',
      password:'',
      errorMessage:'',
      loggingIn:false
    }
    console.log("login ctor finished");
  }

  validateForm() {
    return this.state.username.length > 0 && this.state.password.length > 0;
  }

  async handleClick(event){
    this.setState({
      loggingIn:true,
      errorMessage:''
    });
    var self=this;
    
    var loginResponse = await Api.login(self.state.username, self.state.password);
    if (loginResponse && loginResponse.success === 'true') {
      console.log("Login response");
      console.log(loginResponse);
      self.setState({
        loggingIn:false,
        errorMessage: ''
      });
      
      self.props.history.push('/');
      // Call loginHandler function in Zamger class
      //self.props.loginHandler();
    } else {
      console.log("Login error");
      console.log(loginResponse);
      self.setState({
        loggingIn:false,
        errorMessage: 'Pogrešno korisničko ime ili šifra'
      });
    }
  }

  render() {
    return (
  <div className='login-form'>
    {/*
      Heads up! The styles below are necessary for the correct render of this example.
      You can do same with CSS, the main idea is that all the elements up to the `Grid`
      below must have a height of 100%.
    */}
    <style>{`
      body > div,
      body > div > div,
      body > div > div > div.login-form {
        height: 100%;
      }
    `}</style>
    <Grid
      textAlign='center'
      style={{ height: '100%' }}
      verticalAlign='middle'
    >
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h2' color='blue' textAlign='center'>
          <Image src={logo} />
          {' '}Dobro došli na Zamger
        </Header>
        <Form size='large'>
          <Segment stacked>
            <Form.Input
              fluid
              icon='user'
              iconPosition='left'
              placeholder='Korisničko ime'
              onChange = {(event,newValue) => this.setState({username:newValue.value})}
            />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder='Lozinka'
              type='password'
              onChange = {(event,newValue) => this.setState({password:newValue.value})}
            />

            <Message icon hidden={!this.state.loggingIn}>
              <Icon name='circle notched' loading />
              <Message.Content>
                <Message.Header>Molimo sačekajte</Message.Header>
                Provjeravamo vaše podatke
              </Message.Content>
            </Message>

            <Message negative hidden={this.state.errorMessage === ''}>
              <Message.Header>{this.state.errorMessage}</Message.Header>
            </Message>

            <Button color='blue' fluid size='large' onClick={(event) => this.handleClick(event)}>Kreni</Button>
          </Segment>
        </Form>
      </Grid.Column>
    </Grid>
  </div>
    );
  }
}

export default withRouter(Login)
