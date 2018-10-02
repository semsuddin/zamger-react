import React, { Component } from 'react';
import { Container, Header, Grid, Loader, List } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import RSSParser from '../rss-parser';

class StudentHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasRSS: false,
      news: ['Nema aktuelnih informacija.'],
      announcements: ['Nema obavještenja.'],
      messages: ['Nemate nijednu poruku.']
    };
    this.fetchRSS = this.fetchRSS.bind(this);
  }

  componentDidMount() {
    this.fetchRSS();
  }

  niceDate(d) {
    return d.getDay() + ". " + (d.getMonth()+1) + ".";
  }


  // Fetch news and other data from RSS

  fetchRSS() {
    if (this.props.person.RSS) {
      let parser = new RSSParser();
      var self = this;
      //var rssid = 'aVmeypoyGX';
      var rssid = this.props.person.RSS.id;
      parser.parseURL('https://zamger.etf.unsa.ba/rss.php?id=' + rssid, function(err, feed) {
        console.log(feed);
        console.log(feed.title);
        console.log(err);
        var messages = [];
        var announcements = [];
        var news = [];
        var key=1;
        feed.items.forEach(function(entry) {
          var x, msgUrl;
          if (entry.title.indexOf('Poruka:') === 0) {
            x = entry.guid.indexOf(rssid);
            msgUrl = '/inbox/' + entry.guid.substring(x+11);
            //messages.push( <li key={key}><Link to={msgUrl}>{entry.title.substring(8)}</Link></li> );
            messages.push (
              <List.Item key={key}>
                <List.Icon name='mail' />
                <List.Content>
                  <List.Header as={Link} to={msgUrl}>{entry.title.substring(8)}</List.Header>
                  <List.Description>{entry.content}</List.Description>
                </List.Content>
              </List.Item>
            );
          }
          else if (entry.title.indexOf('Obavijest') === 0) {
            var pd = new Date(Date.parse(entry.pubDate));
            var header = entry.categories.join(" ") + " (" + self.niceDate(pd) + ")";
            x = entry.guid.indexOf(rssid);
            msgUrl = '/inbox/' + entry.guid.substring(x+11);
            var link = "";
            if (entry.link) link = <Link to={msgUrl}>(Dalje...)</Link>;

            announcements.push( 
              <List.Item key={key}>
                <List.Content>
                  <List.Header>{header}</List.Header>
                  <List.Description>{entry.content} {link}</List.Description>
                </List.Content>
              </List.Item>
            );
          }
          else {
            var pi = entry.link.indexOf("predmet=");
            var amp = entry.link.indexOf("&", pi);
            var course = entry.link.substring(pi+8, amp);
            var ai = entry.link.indexOf("ag=");
            var year = entry.link.substr(ai+3);
            msgUrl = 'student/course/'+course+'/'+year;

            news.push( 
              <List.Item key={key}>
                <strong>{entry.categories.join(" ")}:</strong> <Link to={msgUrl}>{entry.title}</Link>
              </List.Item>
            );
          }
          key++;
        });
        if (messages.length === 0) messages.push('Nemate nijednu poruku.');
        if (news.length === 0) news.push('Nema aktuelnih informacija.');
        if (announcements.length === 0) announcements.push('Nema obavještenja.');
        self.setState( { hasRSS: true, messages: messages, announcements: announcements, news: news });
        setTimeout(self.fetchRSS, 60000);
      });
    } else {
      console.log("RSS: no person!");
      setTimeout(this.fetchRSS, 1000);
    }
  }

  render() {
    var name='Nepoznati Korisnik';
    var greeting = 'Dobro došao';
    if (this.props.person && this.props.person.name) {
      name=this.props.person.name + ' ' + this.props.person.surname;
      if (this.props.person.sex !== 'M') greeting = 'Dobro došla';
    }

    return (
    <Container>
      <Header as='h1'>{greeting}, {name}</Header>
      <Grid columns={3} divided>
        <Grid.Column>
          <Header as='h2'>Aktuelno</Header>
          { this.state.hasRSS ? this.state.news :
            <Loader active inline='centered' size='huge' />
          }
        </Grid.Column>
        <Grid.Column>
          <Header as='h2'>Obavještenja</Header>
          { this.state.hasRSS ? 
            <List divided relaxed>{this.state.announcements}</List> :
            <Loader active inline='centered' size='huge' />
          }
        </Grid.Column>
        <Grid.Column>
          <Header as='h2'>Poruke</Header>
          { this.state.hasRSS ? 
            <List divided relaxed>{this.state.messages}</List> :
            <Loader active inline='centered' size='huge' />
          }
        </Grid.Column>
      </Grid>
    </Container>
    );
  }
}

export default StudentHome
