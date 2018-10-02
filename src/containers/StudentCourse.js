import React, { Component } from 'react';
import { Container, Header, Loader, List, Progress, Message, Icon, Segment, Accordion, Breadcrumb } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import Util from '../Util';

import HomeworkTable from '../components/HomeworkTable';
import AttendanceTable from '../components/AttendanceTable';

class StudentCourse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentCourse: [],
      foundCourse: false,
      loaded: false,
      staffVisible: false
    };
    this.findCourse = this.findCourse.bind(this);
    this.handleShowStaff = this.handleShowStaff.bind(this);
  }


  componentDidMount() {
    this.findCourse();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname || this.props.courses.length !== prevProps.courses.length)
      this.findCourse();
  }

  findCourse() {
    if (!this.props.courses || this.props.courses.length === 0) return;

    var self=this;
    var courseId = Number(self.props.match.params.course);
    var courseYear = Number(self.props.match.params.year);

    self.setState( { loaded: true });
    this.props.courses.forEach(function(course) {
      if (course.id === courseId && course.academicYear === courseYear) {
        self.setState( { foundCourse: true, currentCourse: course.fullPortfolio });
      }
    });    
  }

  handleShowStaff() {
    const { staffVisible } = this.state
    this.setState({ staffVisible: !staffVisible })
  }

  render() {
    const { loaded, foundCourse, staffVisible, currentCourse } = this.state

    if (!loaded)
      return (
        <Loader active inline='centered' size='huge' />
      );

    if (!foundCourse)
      return (
        <Message negative icon>
          <Icon name='warning sign' />
          <Message.Content>
            <Message.Header>Nepoznat predmet</Message.Header>
            Probajte koristiti meni s lijeve strane
          </Message.Content>
        </Message>
      );


    let name = currentCourse.CourseOffering.CourseUnit.name;
    let year = currentCourse.CourseOffering.AcademicYear.name;

    // staff
    let staff = [];
    let key=0;
    currentCourse.CourseUnitYear.staff.forEach(function(person) {
      var status = Util.capitalizeFirstLetter( person.status );
      var fullname = person.Person.name + " " + person.Person.surname;
      var msgRecipient = person.Person.login + " (" + fullname + ")";
      if (person.Person.titlesPre) fullname = person.Person.titlesPre + " " + fullname;
      if (person.Person.titlesPost) fullname = fullname + ", " + person.Person.titlesPost;
      staff.push( <List.Item key={key}><b>{status}:</b> <Link to={{ pathname: '/inbox/compose', state: { recipient: msgRecipient } }}>{fullname}</Link></List.Item> );
      key++;
    });

    // Progress bar and scores list
    let value=0;
    let max=0;
    let pass=true;
    let scoreDetails=[];
    let person = this.props.person;
    // TODO: use Activities, not score
    currentCourse.CourseUnitYear.Scoring.elements.forEach(function(element) {
      let score = 0;
      let foundScore = false;
      currentCourse.score.forEach(function(scr) {
        if (scr.CourseActivity.id === element.id) { score = scr.score; foundScore = true; }
      });
      value += score;
      if (score < element.pass) pass=false;

      // Show detailed information for homeworks
      if (element.LmsModule.id === 2 ) {
        scoreDetails.push( 
          <div key={key}>
            <HomeworkTable course={currentCourse.CourseUnitYear.CourseUnit.id} year={currentCourse.CourseUnitYear.AcademicYear.id} 
            activityName={element.guiName} activity={element.id} person={person} summary={true} />
            <p>Za ponovno slanje zadatka, kliknite na sličicu u tabeli iznad.&nbsp; 
            <a href="">Legenda simbola</a></p>
            <br/>
          </div>
        );
        max += element.max; // FIXME
      }

      // Show detailed information for attendance
      else if (element.LmsModule.id === 11 ) {
        scoreDetails.push( 
          <div key={key}>
            <AttendanceTable course={currentCourse.CourseUnitYear.CourseUnit.id} year={currentCourse.CourseUnitYear.AcademicYear.id} 
            activityName={element.guiName} activity={element.id} person={person} />
            <p>Ukupno u kategoriji {element.guiName} imate <b>{score}</b> bodova</p>
          </div>
        );
        max += element.max; // FIXME
      }

      // TODO this doesn't show details yet...
      else if (foundScore) {
        scoreDetails.push( <List.Item key={key}>{element.guiName}: <b>{score}</b> bodova / {element.max} mogućih</List.Item> );
        if (element.LmsModule.id !== 10 || element.ScoringType.id !== 2) max += element.max;
      }
      key++;
    });

    let color = 'green';
    if (value/max < 0.67) color = 'yellow';
    if (value/max < 0.34) color = 'red';

    let grade = '';
    if (currentCourse.grade) {
      var theGrade = this.state.currentCourse.grade;
      if (theGrade === 11)
        theGrade = 'Ispunjene obaveze';
      
      grade = (
      <Segment raised compact key={1}>
        <Header as='h2'>
          <Icon name='check square' />
          <Header.Content>
            <Header.Subheader>
              Konačna ocjena
            </Header.Subheader>
            {theGrade}
          </Header.Content>
        </Header>
      </Segment>
      );
    }


    return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Section as={Link} to="/student">Početna</Breadcrumb.Section>
        <Breadcrumb.Divider />
        <Breadcrumb.Section active>{name} ({year})</Breadcrumb.Section>
      </Breadcrumb>
      <Header as='h1'>{name} ({year})</Header>
      <Accordion>
        <Accordion.Title onClick={this.handleShowStaff} active={staffVisible}><Icon name='dropdown' /> Nastavni ansambl</Accordion.Title>
        <Accordion.Content active={staffVisible}>
          <List>{staff}</List>
        </Accordion.Content>
      </Accordion>
      <Progress value={value} total={max} color={color} progress='value' />
      <List>{scoreDetails}</List>
      <p>Ukupno: <b>{value}</b> bodova od <b>{max}</b> mogućih</p>
      {grade}
    </Container>
    );
  }
}

export default StudentCourse
