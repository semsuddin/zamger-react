import React, { Component } from 'react';
import { Container, Header, Loader, Message, Icon, Breadcrumb, Form, TextArea, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import Api from '../Api';

import HomeworkTable from '../components/HomeworkTable';

class StudentHomework extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentCourse: [],
      currentActivity: 0,
      foundCourse: false,
      loaded: false,
      homeworks: [],
      currentHomework: 1,
      currentAssignment: 1,
      homeworkError: ''
    };
    this.findCourse = this.findCourse.bind(this);
    this.fetchHomeworks = this.fetchHomeworks.bind(this);
  }


  componentDidMount() {
    this.findCourse();
    this.fetchHomeworks();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname || this.props.courses.length !== prevProps.courses.length) {
      this.findCourse();
      this.fetchHomeworks();
    }
  }

  fetchHomeworks() {
    if (typeof this.props.person.id === 'undefined') {
      console.log("Person not ready");
      setTimeout(this.fetchHomeworks, 500);
      return;
    }

    var self = this;
    var courseId = Number(self.props.match.params.course);
    var courseYear = Number(self.props.match.params.year);
    var activityId = Number(self.props.match.params.scoringElement);
    var currentHomework=0, currentAssignment=0, maxAssignment=0;
    if (self.props.location.state && self.props.location.state.currentHomework) {
      currentHomework = Number(self.props.location.state.currentHomework);
      currentAssignment = Number(self.props.location.state.currentAssignment);
    }
    if (activityId < 1) return;

    var url = "homework/course/" + courseId + "/student/" + this.props.person.id;
    //var url = "homework/course/" + courseId + "/student/6234";
    url += "?year=" + courseYear + "&scoringElement=" + activityId + "&resolve[]=Homework";

    Api.requestJson(url).then(function(result) {
      if (result.success && result.success === "false") {
        console.log("Api returned for "+url);
        console.log(result);
        throw new Error();
      }

      if (result.results.length === 0) {
        self.setState( { loaded: true, homeworkError: 'Trenutno nijedna zadaća nije otvorena za slanje' } );
        return;
      }

      if (currentHomework === 0) {
        result.results.forEach(function(homework) {
          if (homework.Homework.id > currentHomework)
            currentHomework = homework.Homework.id;
          if (homework.Homework.id === currentHomework && homework.assignNo > currentAssignment)
            maxAssignment = homework.assignNo;
          if (homework.Homework.id === currentHomework && homework.id === null && currentAssignment === 0)
            currentAssignment = homework.assignNo;
        });
        if (currentAssignment === 0) currentAssignment = maxAssignment;
      }

      self.setState( { homeworks: result.results, loaded: true, currentHomework: currentHomework, currentAssignment: currentAssignment } );

    }).catch(function(error) {
      if (error.message === "Status 404") {
        self.setState( { loaded: true, homeworkError: 'Trenutno nijedna zadaća nije otvorena za slanje' } );
      }
      else {
        console.log("Catch");
        console.log(error.message);
      }
    });
  }

  findCourse() {
    if (!this.props.courses || this.props.courses.length === 0) return;

    var self=this;
    var courseId = Number(self.props.match.params.course);
    var courseYear = Number(self.props.match.params.year);
    var activityId = Number(self.props.match.params.scoringElement);

    this.props.courses.forEach(function(course) {
      if (course.id === courseId && course.academicYear === courseYear) {
        self.setState( { foundCourse: true, currentCourse: course.fullPortfolio });
        course.fullPortfolio.CourseUnitYear.Scoring.elements.forEach(function (element) {
          if (element.id === activityId) {
            console.log("Pronađena aktivnost "+element.id);
            self.setState( { currentActivity: element });
          }
        });
      }
    });    
  }

  handleShowStaff() {
    const { staffVisible } = this.state
    this.setState({ staffVisible: !staffVisible })
  }

  render() {
    const { loaded, foundCourse, homeworks, currentCourse, currentHomework, currentAssignment, currentActivity, homeworkError } = this.state

    if (!loaded)
      return (
        <Loader active inline='centered' size='huge' />
      );

    if (homeworkError !== '')
      return (
        <Message negative icon>
          <Icon name='warning sign' />
          <Message.Content>
            <Message.Header>{homeworkError}</Message.Header>
          </Message.Content>
        </Message>
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


    var name = currentCourse.CourseOffering.CourseUnit.name;
    var year = currentCourse.CourseOffering.AcademicYear.name;
    var urlPart = currentCourse.CourseOffering.CourseUnit.id + "/" + currentCourse.CourseOffering.AcademicYear.id;
    var person = this.props.person;

    var currentHomeworkName = '', homeworkData = false;
    homeworks.forEach(function(homework) {
      if (homework.Homework.id === currentHomework) {
        currentHomeworkName = homework.Homework.name;
        if (homework.assignNo === currentAssignment)
          homeworkData = homework;
      }
    });

    // Status display
    var statusDisplay = '';
    if (homeworkData && homeworkData.status === 5)
      statusDisplay = (
        <Message positive icon>
          <Icon name='check' />
          <Message.Content>Status zadaće
          <Message.Header>Zadaća pregledana: {homeworkData.score} bodova</Message.Header>
          </Message.Content>
        </Message>
      );
    if (homeworkData && (homeworkData.status === 1 || homeworkData.status === 4))
      statusDisplay = (
        <Message icon>
          <Icon name='search' />
          <Message.Content>Status zadaće
          <Message.Header>Pregled u toku</Message.Header>
          </Message.Content>
        </Message>
      );
    if (homeworkData && homeworkData.status === 2)
      statusDisplay = (
        <Message negative icon>
          <Icon name='copy' />
          <Message.Content>Status zadaće
          <Message.Header>Zadaća prepisana</Message.Header>
          </Message.Content>
        </Message>
      );
    if (homeworkData && homeworkData.status === 3)
      statusDisplay = (
        <Message negative icon>
          <Icon name='bug' />
          <Message.Content>Status zadaće
          <Message.Header>Ne može se kompajlirati</Message.Header>
          </Message.Content>
        </Message>
      );

    // Deadline notice
    var deadlineNotice = '';
    var disabled = homeworkData.Homework.readonly;
    if (homeworkData && homeworkData.deadline < Date.now()) {
      deadlineNotice = (<p><b>Vrijeme za slanje ove zadaće je isteklo</b></p>);
      disabled = true;
    }

    // Homework content
    var content = '';
    if (homeworkData && homeworkData.Homework.attachment)
      content = ( <a>{homeworkData.filename}</a> );
    else if (homeworkData) 
      content = ( 
        <Form>
          <TextArea disabled={disabled}>gdfgdfg</TextArea>
          <Button type='submit'>Pošalji zadaću</Button>
        </Form>
      );

    return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Section as={Link} to="/student">Početna</Breadcrumb.Section>
        <Breadcrumb.Divider />
        <Breadcrumb.Section as={Link} to={"/student/course/" + urlPart}>{name} ({year})</Breadcrumb.Section>
        <Breadcrumb.Divider />
        <Breadcrumb.Section active>Slanje zadaće</Breadcrumb.Section>
      </Breadcrumb>
      <Header as='h1'>{currentHomeworkName}, zadatak {currentAssignment}</Header>
      <HomeworkTable course={currentCourse.CourseUnitYear.CourseUnit.id} year={currentCourse.CourseUnitYear.AcademicYear.id} 
        activityName={currentActivity.guiName} activity={currentActivity.id} person={person} currentHomework={currentHomework} currentAssignment={currentAssignment} />
      {statusDisplay}
      {deadlineNotice}
      {content}
    </Container>
    );
  }
}

export default StudentHomework
