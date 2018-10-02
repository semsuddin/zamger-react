import React, { Component } from 'react';
import { Container, Header, Table, Menu, Icon, Loader, Dimmer, Segment, Divider, Label, Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import Api from '../Api';
import Util from '../Util';

class Inbox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      page: 1,
      count: 0,
      loading: true,
      showMessage: false,
      messageId: 0,
      message: [],
      outbox: false,
      inboxError: '',
      messageError: '',
    };
    this.checkInbox = this.checkInbox.bind(this);
    this.setPage = this.setPage.bind(this);
    this.readMessage = this.readMessage.bind(this);

    this.pageSize = 20;
    this.checkInboxTimeout = false;
    if (this.props.match && this.props.match.params && this.props.match.params.msgid) {
      this.state.showMessage = true;
      this.state.messageId = this.props.match.params.msgid;
      this.readMessage(this.props.match.params.msgid);
    }
    if (this.props.location.pathname.indexOf('outbox') > -1)
      this.state.outbox = true;
  }

  componentDidMount() {
    this.checkInbox();
  }

  // This method is called when changing routes that all resolve to Inbox class
  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      if (this.props.match.params.hasOwnProperty('msgid')) {
        // We assume that URL /outbox/:id was reached from /outbox
        let isOutbox = (this.props.location.pathname.indexOf('outbox') > -1);
        this.setState({
          outbox: isOutbox,
          showMessage: true,
          messageId: this.props.match.params.msgid,
          message: [],
        });
        this.readMessage(this.props.match.params.msgid);

      } else if (this.props.location.pathname.indexOf('outbox') > -1) {
        this.setState({
          showMessage: false,
          messageId: 0,
          outbox: true,
          messages: [],
          page: 1,
          loading: true,
        });
        clearTimeout(this.checkInboxTimeout);
        this.checkInboxTimeout = setTimeout(this.checkInbox, 1000);

      } else {
        this.setState({
          showMessage: false,
          messageId: 0,
          outbox: false,
          messages: [],
          page: 1,
          loading: true,
        });
        clearTimeout(this.checkInboxTimeout);
        this.checkInboxTimeout = setTimeout(this.checkInbox, 1000);
      }
    }
  }

  // Callback for clicking on page number
  setPage(page) {
    this.setState({ page, messages: [], loading: true });
    clearTimeout(this.checkInboxTimeout);
    this.checkInboxTimeout = setTimeout(this.checkInbox, 1000);
  }


  // API querying methods

  // Get list of messages in inbox/outbox
  checkInbox() {
    const self = this;
    var start = this.pageSize * (this.state.page - 1);
    let url = `inbox?messages=${this.pageSize}&start=${start}&resolve[]=Person`;
    if (this.state.outbox)
      url = `inbox/outbox?messages=${this.pageSize}&start=${start}&resolve[]=Person`;

    Api.request(url).then((result) => {
      if (result.status === 200) {
        return result.json();
      } else if (result.status === 403) {
        clearTimeout(self.checkInboxTimeout);
        // Error 403: No permission to access own inbox, means user is not logged in
        this.props.history.push('/login');
        throw new Error();
      } else {
        // Check after some more time
        throw new Error();
      }

    }).then((msgs) => {
      const messagesArray = [];
      msgs.results.forEach(function(message) {
        let messageObject = {};
        messageObject.id = message.id;

        const msgTime = new Date(Date.parse(message.time));
        messageObject.time = `${msgTime.getDate()}. ${msgTime.getMonth()+1}, ${msgTime.getHours()}:${msgTime.getMinutes()}`;
        if (self.state.outbox) {
          messageObject.sender = `${message.receiver.name} ${message.receiver.surname}`;
          messageObject.url = `/outbox/${message.id}`;
        }
        else {
          messageObject.sender = `${message.sender.name} ${message.sender.surname}`;
          messageObject.url = `/inbox/${message.id}`;
        }
        messageObject.subject = message.subject.trim();
        if (messageObject.subject.length === 0) messageObject.subject = '[Bez naslova]';
        messageObject.unread = message.unread;

        messagesArray.push(messageObject);
      });

      console.log('Checkinbox finished');
      self.setState({ messages: messagesArray, loading: false, inboxError: '' });
      clearTimeout(self.checkInboxTimeout);
      self.checkInboxTimeout = setTimeout(self.checkInbox, 15000);

    }).catch((error) => {
      clearTimeout(self.checkInboxTimeout);
      self.checkInboxTimeout = setTimeout(self.checkInbox, 60000);
      self.setState( { inboxError: 'Poteškoće sa pristupom porukama' } );

    });

    // Check total number of messages (for updating page list)
    Api.requestJson('inbox/count').then((res) => {
      self.setState({ count: res.results.count });
    }).catch((error) => {
      self.setState({ inboxError: 'Poteškoće sa pristupom porukama' });
    });
 
  }


  // Get single message
  readMessage(msgid) {
    console.log('readMessage');
    const self = this;
    Api.requestJson(`inbox/${msgid}?resolve[]=Person`).then((msg) => {
      console.log('readMessage finished');
      self.setState({ loadingMessage: false, message: msg, messageError: '' });
    }).catch((error) => {
      self.setState({ loadingMessage: false, messageError: 'Ne može se pristupiti poruci' });
    });
  }


  // Render components

  // Render a single message (if shown)
  renderMessage() {
    const replyUrl = `/inbox/compose/${this.state.messageId}`;
    let loadingMessage = true;
    let currMsg = { vrijeme: '', posiljalac: '', primalac: '', naslov: '', tekst: '' };
    if (this.state.message && this.state.message.id) {
      loadingMessage = false;
      currMsg.vrijeme = this.state.message.time;
      currMsg.posiljalac = `${this.state.message.sender.name} ${this.state.message.sender.surname}`;
      if (this.state.outbox)
        currMsg.primalac = `${this.state.message.receiver.name} ${this.state.message.receiver.surname}`;
      else
        currMsg.primalac = `${this.props.person.name} ${this.props.person.surname}`; // FIXME
      currMsg.naslov = this.state.message.subject;
      currMsg.tekst = Util.urls2links(Util.decodeHtmlEntities(this.state.message.text));
    }
    return (
      <Segment>
        <Header as="h2">Prikaz poruke</Header>
        <Message negative hidden={this.state.messageError === ''}>{this.state.messageError}</Message>
        <Dimmer.Dimmable dimmed={true}>
          <Dimmer active={loadingMessage} inverted>
            <Loader />
          </Dimmer>
        <Table compact="very">
          <Table.Body>
            <Table.Row style={{ backgroundColor: '#ddd' }}>
              <Table.Cell width={2}>Vrijeme slanja:</Table.Cell>
              <Table.Cell width={10}>{currMsg.vrijeme}</Table.Cell>
            </Table.Row>
            <Table.Row style={{ backgroundColor: '#ddd' }}>
              <Table.Cell width={2}>Pošiljalac:</Table.Cell>
              <Table.Cell width={10}>{currMsg.posiljalac}</Table.Cell>
            </Table.Row>
            <Table.Row style={{ backgroundColor: '#ddd' }}>
              <Table.Cell width={2}>Primalac:</Table.Cell>
              <Table.Cell width={10}>{currMsg.primalac}</Table.Cell>
            </Table.Row>
            <Table.Row style={{ backgroundColor: '#ddd' }}>
              <Table.Cell width={2}>Naslov:</Table.Cell>
              <Table.Cell width={10}>{currMsg.naslov} (<Link to={replyUrl}>odgovori</Link>)</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell colSpan={2}>{currMsg.tekst}</Table.Cell>          
            </Table.Row>
          </Table.Body>
        </Table>
        </Dimmer.Dimmable>
        <Link to={replyUrl}>Odgovorite na poruku</Link>
        <Divider />
      </Segment>
    );
  }

  // Render table footer with navigation links
  renderFooter() {
    // Construct footer navigation menu for pages
    const countPages = 1 + Math.round(this.state.count / this.pageSize);
    //var countPages = 3;
    const footer = [];
    const page = this.state.page;

    if (page === 1)
      footer.push(
        <Menu.Item as="a" icon disabled key={0}>
          <Icon name="chevron left" />
        </Menu.Item>
      );
    else
      footer.push(
        <Menu.Item as="a" icon onClick={() => this.setPage(page - 1)} key={0}>
          <Icon name="chevron left" />
        </Menu.Item>
      );

    for (var i = 1; i <= countPages; i++) {
      if (i === this.state.page)
        footer.push( <Menu.Item as="a" disabled key={i}><b>{i}</b></Menu.Item> );
      else {
        let pg=i;
        footer.push( <Menu.Item as="a" onClick={() => this.setPage(pg)} key={i}>{i}</Menu.Item> );
      }

      if (countPages > 4 && i === 2 && i < page-2) {
        footer.push( <Menu.Item key={i+1}>...</Menu.Item> );
        i = this.state.page - 2;
      }
      if (countPages > 4 && i>page && i>=2 && i<countPages-1) {
        footer.push( <Menu.Item key={i+1}>...</Menu.Item> );
        i = countPages - 1;
      }
    }

    if (page === countPages)
      footer.push(
        <Menu.Item as="a" icon disabled key={countPages+1}>
          <Icon name="chevron right" />
        </Menu.Item>
      );
    else
      footer.push(
        <Menu.Item as="a" icon onClick={() => this.setPage(page+1)} key={countPages+1}>
          <Icon name="chevron right" />
        </Menu.Item>
      );
    return footer;    
  }

  renderInbox() {
    let key = 1;
    const result = [];
    const self = this;

    this.state.messages.forEach(function(message) {
      let newTag = (message.unread) ? ( <Label tag color='green' size='mini'>Novo</Label> ) : '';
      result.push(
        <Table.Row warning={message.unread} active={message.id === self.state.messageId} key={key}>
          <Table.Cell>{message.time}</Table.Cell>
          <Table.Cell>{message.sender}</Table.Cell>
          <Table.Cell>{newTag}<Link to={message.url}>{message.subject}</Link></Table.Cell>
        </Table.Row>          
      );
      key+=1;
    });

    if (this.state.messages.length === 0) {
      result.push(
        <Table.Row key={key}>
          <Table.Cell colSpan='3'>Nemate nijednu poruku</Table.Cell>
        </Table.Row>          
      );          
    }
    return result;
  }

  // Main render function
  render() {
    var message = '';
    if (this.state.showMessage) {
      message = this.renderMessage();
    }

    var messageTable = this.renderInbox();
    var footer = this.renderFooter();
    var menu = ( <p><Link to="/inbox/compose">Pošalji novu poruku</Link> * <Link to="/outbox">Vaše poslane poruke</Link></p> );
    var columnTitle = 'Autor';
    if (this.state.outbox) {
      menu = ( <p><Link to="/inbox/compose">Pošalji novu poruku</Link> * <Link to="/inbox">Vaše sanduče</Link></p> );
      columnTitle = 'Primalac';
    }

    return (
      <Container style={{ marginTop: '7em' }}>
        <Header as='h1'>Lične poruke</Header>
        {menu}
        {message}
        <Message negative hidden={this.state.inboxError === ''}>
          <Message.Header>Došlo je do privremenih poteškoća sa pristupom vašim porukama</Message.Header>
          Pokušaćemo ponovo osvježiti spisak za 60 sekundi.
        </Message>
        <Dimmer.Dimmable dimmed={true}>
          <Dimmer active={this.state.loading} inverted>
            <Loader />     
          </Dimmer>
        <Table selectable striped compact fixed>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={2}>Datum</Table.HeaderCell>
              <Table.HeaderCell width={3}>{columnTitle}</Table.HeaderCell>
              <Table.HeaderCell width={10}>Naslov</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            { messageTable }
          </Table.Body>

          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan='3'>
                <Menu floated='right' pagination>
                  {footer}
                </Menu>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
        </Dimmer.Dimmable>
      </Container>
    );
  }
}

export default Inbox
