import React, { Component } from 'react';
import { Container, Dropdown, Image, Menu, Segment, Icon, Label } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import logo from './etf-logo.svg';
import Api from './Api';
import Routes from './Routes';


class Zamger extends Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      person: {
        name: '',
        surname: '',
      },
      loggedIn: false,
      showPrivilegeMenu: false,
      unreadMsgs: 0,
    };
    this.logout = this.logout.bind(this);
    this.getPersonData = this.getPersonData.bind(this);
    this.checkPrivilege = this.checkPrivilege.bind(this);
    this.checkInbox = this.checkInbox.bind(this);

    Api.checkCookie();
    this.state.loggedIn = Api.isLoggedIn;
  }

  async componentDidMount() {
    await this.getPersonData();
  }

  // This method is called when changing routes that all resolve to Inbox class
  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname && prevProps.location.pathname === '/login') {
      this.getPersonData();
    }
  }

  async getPersonData() {
    console.log('calling getPersonData');
    const person = await Api.getPerson();
    console.log('await finished');
    if (!Api.isLoggedIn) {
      this.setState({ person: {}, loggedIn: false });
      this.props.history.push('/login');
      return;
    }
    if (person.privileges) {
      if (this.state) {
        this.setState({
          person,
          loggedIn: true,
          showPrivilegeMenu: person.privileges.length > 1,
        });
      }
    }

    // Populate person menu
    if (this.props.location.pathname === '/') this.redirectRoot();

    // We can start polling to check inbox state
    this.checkInbox();
  }

  checkInbox() {
    const self = this;
    const url = 'inbox/unread';
    Api.requestJson(url).then((unread) => {
      self.setState({ unreadMsgs: unread.results.length });
      setTimeout(self.checkInbox, 15000);
    }).catch((error) => {
      // Try again after one minute
      setTimeout(self.checkInbox, 60000);
    });
  }

  redirectRoot() {
    console.log('calling redirectRoot');
    const { person } = this.state;

    if (person.privileges.includes('siteadmin'))
      this.props.history.push('/admin');
    else if (person.privileges.includes('studentska'))
      this.props.history.push('/studentska');
    else if (person.privileges.includes('nastavnik'))
      this.props.history.push('/nastavnik');
    else if (person.privileges.includes('student'))
      this.props.history.push('/student');
    else // User has no privileges!?
      this.props.history.push('/404');
  }

  checkPrivilege(privilege) {
    if (!this.state.loggedIn) return false;
    if (!this.state.person.privileges) return false;
    return this.state.person.privileges.includes(privilege);
  }

  logout() {
    Api.logout();
    this.setState({ loggedIn: false });
    this.props.history.push('/login');
  }

  render() {
    const self = this;

    const privilegeMenu = [];
    if (this.state.showPrivilegeMenu) {
      privilegeMenu.push(<Dropdown.Divider key={0} />);
      privilegeMenu.push(<Dropdown.Header key={1}>Uloga</Dropdown.Header>);
      if (this.checkPrivilege('student'))
        privilegeMenu.push(<Dropdown.Item key={2} as={Link} to="/student">Student</Dropdown.Item>);
      if (this.checkPrivilege('nastavnik'))
        privilegeMenu.push(<Dropdown.Item key={3} as={Link} to="/nastavnik">Nastavnik</Dropdown.Item>);
      if (this.checkPrivilege('studentska'))
        privilegeMenu.push(<Dropdown.Item key={4} as={Link} to="/studentska">Studentska služba</Dropdown.Item>);
      if (this.checkPrivilege('siteadmin'))
        privilegeMenu.push(<Dropdown.Item key={5} as={Link} to="/admin">Administrator</Dropdown.Item>);
    }

    return (
      <div>
        <Menu fixed="top" inverted>
          <Container>
            <Menu.Item as="a" header href="https://zamger.etf.unsa.ba">
              <Image
                size="mini"
                src={logo}
                style={{ marginRight: '1.5em' }}
              />
              Zamger v5
            </Menu.Item>
            <Menu.Item position="right" href="https://zamger.etf.unsa.ba/static/doc/zamger-uputstva-42-nastavnik.pdf">
              <Icon name="book" /> Uputstva
            </Menu.Item>
            <Menu.Item href="https://github.com/etf-sarajevo/zamger/issues">
              <Icon name="bug" /> Prijavite bug
            </Menu.Item>
            <Menu.Item as={Link} to="/inbox">
              <Icon name="inbox" size="large">
                { (this.state.unreadMsgs > 0) ?
                  <Label color="red" circular floating size="mini" style={{ position: 'absolute', top: '10px', left: '45px' }}>
                    {this.state.unreadMsgs}
                  </Label>
                  : ''
                }
              </Icon>
            </Menu.Item>

            { this.state.loggedIn ?
              <Dropdown item simple text={`☻ ${this.state.person.name} ${this.state.person.surname}`} position="right">
                <Dropdown.Menu>
                  <Dropdown.Item>Profil</Dropdown.Item>
                  <Dropdown.Item>Postavke</Dropdown.Item>
                  { privilegeMenu }
                  <Dropdown.Divider />
                  <Dropdown.Item icon="sign out" onClick={this.logout} text="Odjava" />
                </Dropdown.Menu>
              </Dropdown>
              : '' }
          </Container>
        </Menu>

        <Routes loginHandler={self.getPersonData} person={this.state.person} />

        <Segment
          inverted
          vertical
          style={{ margin: '5em 0em 0em', padding: '1em 0em' }}
        >
          <Container textAlign="center">
            Copyright (c) 2006-2018 <a href="static/doc/CREDITS.txt">Vedran Ljubović i drugi</a><br />
            <Image
              centered
              size="mini"
              src={logo}
              verticalAlign="middle"
              spaced="right"
            />
            Elektrotehnički fakultet Sarajevo
          </Container>
        </Segment>
      </div>
    );
  }
}

export default withRouter(Zamger);
