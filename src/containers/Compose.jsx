import React, { Component } from 'react';
import { Container, Header, Form, Message, Search, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import Api from '../Api';
import Util from '../Util';

class Compose extends Component {
  constructor(props) {
    super(props);
    this.state = {
      replyTo: 0,
      loadingReplyTo: false,
      errorMsg: '',
      subject: '',
      recipient: '',
      recipientID: 0,
      text: '',
      searchingUsers: false,
      searchResults: [],
      sendingMessage: false,
      successMsg: '',
    };
    this.readMessage = this.readMessage.bind(this);
    this.handleChangeRecipient = this.handleChangeRecipient.bind(this);
    this.doSearch = this.doSearch.bind(this);
    this.handleResultSelect = this.handleResultSelect.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.sendMessageReal = this.sendMessageReal.bind(this);

    this.resultsIdMatch = [];
    this.searchTimeout = null;

    if (this.props.match && this.props.match.params && this.props.match.params.msgid) {
      this.state.replyTo = this.props.match.params.msgid;
      this.state.loadingReplyTo = true;
      this.readMessage(this.props.match.params.msgid);
    }

    if (props.location.state && props.location.state.recipient)
      this.state.recipient = props.location.state.recipient;
  }


  // API querying methods

  // Get single message
  readMessage(msgid) {
    console.log('readMessage()');
    const self = this;
    Api.requestJson(`inbox/${msgid}?resolve[]=Person`).then((msg) => {
      console.log('readMessage finished');

      let recipient = `${msg.sender.name} ${msg.sender.surname}`;
      if (msg.sender.id === self.props.person.id)
        recipient = `${msg.recipient.name} ${msg.recipient.surname}`;
      let { subject } = msg;
      if (subject.substring(0, 3) !== 'Re:') subject = `Re: ${subject}`;
      let text = `> ${Util.decodeHtmlEntities(msg.text).replace(/\n/g, '\n> ')}\n\n`;

      self.setState({ 
        loadingReplyTo: false, 
        subject, 
        recipient, 
        text,
      });
    }).catch(function(error) {
      self.setState({ 
        loadingReplyTo: false, 
        errorMsg: 'Ne može se pristupiti poruci na koju replicirate' 
      });
    });
  }

  // Search recipients
  handleChangeRecipient(event, { value }) {
    console.log(`Search: ${value}`);
    if (value.length < 3) {
      this.setState({
        recipient: value, 
        recipientId: 0, 
        searchingUsers: false, 
        searchResults: [], 
      });
      return;
    }
    this.setState({ 
      recipient: value, 
      recipientId: 0, 
      searchingUsers: true, 
      searchResults: [], 
    });
    this.resultsIdMatch = [];

    console.log(`Clear timeout ${this.searchTimeout}`);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(this.doSearch, 500);
    console.log(`Set timeout ${this.searchTimeout} query ${this.state.recipient}`);
  }

  // Split Api call to separate function for recursive call (retrySearch)
  doSearch() {
    console.log(`doSearch ${this.state.recipient}`);
    const self = this;
    Api.requestJson(`person/search?query=${this.state.recipient}`).then((res) => {
      const searchResults = [];
      let i = 1;
      res.results.forEach((user) => {
        const description = `${user.login} (${user.name} ${user.surname})`;
        searchResults.push({ key: i, description });
        self.resultsIdMatch[description] = user.id;
        i+=1;
      });

      self.setState({ searchResults, searchingUsers: false });
    }).catch((error) => {
      // Search failed, don't know why
      self.setState({ searchingUsers: false, searchResults: [] });
    });
  }

  handleResultSelect = (e, { result }) => this.setState({
    recipient: result.description,
    recipientId: this.resultsIdMatch[result.description],
  })

  // Form handlers
  handleSubjectChange(event) {
    this.setState({ messageSubject: event.target.value });
  }
  handleTextChange(event) {
    this.setState({ messageText: event.target.value });
  }


  // Methods for sending message

  sendMessage() {
    this.setState({ sendingMessage: true });
    const self = this;

    if (this.state.recipientId > 0) {
      console.log('messageRecipientId');
      this.sendMessageReal(this.state.recipientId);
      return;
    }
    let recipient = this.state.recipient;
    if (recipient.indexOf('(') > 0) recipient = recipient.substring(0, recipient.indexOf('('));

    Api.requestJson(`person/search?query=${recipient}`).then((res) => {
      if (res.results.length === 0)
        self.setState({ sendingMessage: false, errorMsg: 'Nepoznat primalac' });
      else if (res.results.length > 1)
        self.setState({ sendingMessage: false, errorMsg: 'Više korisnika odgovara unesenom primaocu' });
      else
        self.sendMessageReal(res.results[0].id);
    }).catch((error) => {
      self.setState({ sendingMessage: false, errorMsg: 'Nepoznat primalac' });
    });
  }

  sendMessageReal(userId) {
    console.log(`sendMessageReal ${userId}`);
    const message = {
      id: 0,
      type: 2,
      range: 7,
      receiver: { className: 'Person', id: userId },
      sender: { className: 'Person', id: this.props.person.id },
      time: 0,
      ref: this.state.replyTo,
      subject: this.state.messageSubject,
      text: this.state.messageText,
      unread: true,
    };
    const params = { message };
    const self = this;

    Api.requestPost('inbox', params).then((res) => {
      console.log('Api responded:');
      console.log(res);
      if (res.status !== 201)
        throw new Error();

      res = res.json();
      return res;
    }).then((res) => {
      console.log('JSON object:');
      console.log(res);

      self.setState( { sendingMessage: false, successMsg: 'Poruka uspješno poslana' } );
      setTimeout(() => { self.props.history.push('/inbox'); }, 1000);
    }).catch(function(error) {
      console.log('Error object:');
      console.log(error);
      self.setState( { sendingMessage: false, errorMsg: 'Greška prilikom slanja poruke' } );
    });
  }



  // Main render function
  render() {
    const { searchingUsers, searchResults, recipient, 
      subject, text, sendingMessage } = this.state;

    return (
      <Container style={{ marginTop: '7em' }}>
        <Header as='h1'>Lične poruke</Header>
        <p><Link to="/inbox">Nazad na inbox</Link></p>
        <Message negative hidden={this.state.errorMsg === ''} header={this.state.errorMsg} />
        <Message positive hidden={this.state.successMsg === ''} header={this.state.successMsg} />
        <Message icon hidden={!sendingMessage}>
          <Icon name="circle notched" loading /> Šaljem poruku...
        </Message>
        <Header as="h2">Slanje poruke</Header>
        <Form>
          <Form.Field>
            <label>Primalac</label>
            <Search 
              loading={searchingUsers} 
              icon="users" 
              results={searchResults} 
              placeholder="Ime i prezime"
              value={recipient} 
              onSearchChange={this.handleChangeRecipient} 
              onResultSelect={this.handleResultSelect} 
            />
          </Form.Field>
          <Form.Field>
            <label>Naslov</label>
            <input placeholder="Tema poruke" value={subject} onChange={this.handleSubjectChange} />
          </Form.Field>
          <Form.Field>
            <label>Tekst</label>
            <textarea placeholder="Tekst poruke" value={text} onChange={this.handleTextChange} />
          </Form.Field>
          <Form.Button onClick={this.sendMessage}>Pošalji</Form.Button>
        </Form>
      </Container>
    );
  }
}

export default Compose;
