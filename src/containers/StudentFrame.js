import React, { Component } from 'react';
import { Route, Redirect } from "react-router-dom";
import { Container, Grid, Loader, Menu, Accordion, Label, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import StudentHome from './StudentHome';
import StudentCourse from './StudentCourse';
import StudentHomework from './StudentHomework';
import Api from '../Api';


const PrivateRoute = ({ component: Component, person, courses, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      Api.isLoggedIn ? (
        <Component {...props} person={person} courses={courses} />
      ) : (
        <Redirect
          to={{
            pathname: "/login",
            state: { from: props.location }
          }}
        />
      )
    }
  />
);

class StudentFrame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeCourse: -1,
      courses: [],
      fetchedCourses: false,
      showArchived: false
    };
    this.getCoursesList = this.getCoursesList.bind(this);
    this.renderCourses = this.renderCourses.bind(this);
    this.handleShowArchived = this.handleShowArchived.bind(this);
  }

  componentDidMount() {
    this.getCoursesList();
  }

  // Get a list of courses attended by this student
  getCoursesList() {
    // Note: API is inefficient and will be improved

    if (this.state.fetchedCourses) return; // Course list will not change between sessions
    if (typeof this.props.person.id === 'undefined') {
      console.log("Person not ready");
      setTimeout(this.getCoursesList, 500);
      return;
    }
    var self = this;

    var url = "course/student/"+this.props.person.id+"?all=true&resolve[]=Scoring&resolve[]=LmsModule&resolve[]=CourseActivity";
    //var url = "course/student/6234?all=true&resolve[]=Scoring&resolve[]=LmsModule&resolve[]=CourseActivity";
    Api.requestJson(url).then(function(res) {
      var courses = [];

      res.results.forEach(function(portfolio) {
        var course = {};
        course.id = portfolio.CourseOffering.CourseUnit.id;
        course.name = portfolio.CourseOffering.CourseUnit.name;
        course.academicYear = portfolio.CourseOffering.AcademicYear.id;
        course.semester = portfolio.CourseOffering.semester;
        course.fullPortfolio = portfolio;
        course.modules = [];


        course.modules.push({ name: 'Dnevnik', external: true, url: 'https://zamger.etf.unsa.ba/index.php?sta=izvjestaj/predmet&predmet='+course.id+'&ag='+course.academicYear});
        portfolio.CourseUnitYear.Scoring.elements.forEach(function(scoringElement) {
          var modId = scoringElement.LmsModule.id;

          // FIXME: hardcode until we improve Api
          if (modId === 10 || modId === 11 || modId === 12) return;
          if (modId === 2)
            course.modules.push({ name: scoringElement.guiName, external: false, link: '/student/homework/'+ course.id+"/"+course.academicYear+"/"+scoringElement.id });
        });

        courses.push(course);
      });
      self.setState( { fetchedCourses: true, courses: courses });
    }).catch(function(error) {
      // Do nothing?
    });

  }


  // Render courses menu
  renderCourses() {
    const { activeCourse } = this.state

    var result = [];
    var key = 1;
    var self=this;

    // If showArchived is false, we first need to find current academic year and semester
    var currentYear=0, currentSemester=1;
    if (!this.state.showArchived) {
      this.state.courses.forEach(function(course) {
        if (course.academicYear > currentYear) currentYear = course.academicYear;
      });
      this.state.courses.forEach(function(course) {
        if (course.academicYear === currentYear && course.semester % 2 === 0) currentSemester=0;
      });
    }

    var prevCourse = false, semesterName;
    this.state.courses.forEach(function(course) {
      if (!self.state.showArchived && (course.academicYear !== currentYear || course.semester % 2 !== currentSemester))
        return;

      if (self.state.showArchived && (!prevCourse || prevCourse.academicYear !== course.academicYear || prevCourse.semester !== course.semester)) {
        if (course.semester % 2 === 1)
          semesterName = 'Zimski semestar';
        else
          semesterName = 'Ljetnji semestar';
        result.push( <div key={key++}><b>{semesterName}, {course.fullPortfolio.CourseOffering.AcademicYear.name}</b></div> );
      }
      prevCourse = course;

      var urlPart = "/" + course.id + "/" + course.academicYear;
      result.push(
          <Accordion.Title key={key} active={activeCourse === key} index={key} onClick={self.chooseCourse}>
            <Icon name='dropdown' /><Label color='blue' content={course.name} />
          </Accordion.Title>
      );

      var menuItems = [];
      var key2 = 100;
      menuItems.push ( 
        <Menu.Item key={key2-1} as={Link} to={"/student/course" + urlPart}>Dashboard</Menu.Item> 
      );

      course.modules.forEach(function(module) {
        if (module.external)
          menuItems.push( <Menu.Item key={key2} as='a' target="_blank" href={module.url}>{module.name}</Menu.Item> );
        else
          menuItems.push( <Menu.Item key={key2} as={Link} to={module.link}>{module.name}</Menu.Item> );
        key2++;
      });
          
      result.push(
          <Accordion.Content key={key+1} active={activeCourse === key}>
            <Menu vertical compact text style={{ marginLeft: '2em', marginTop: '-1em', marginBottom: '-1em' }}>
              {menuItems}
            </Menu>
          </Accordion.Content>
      );
      key+=2;
    });

    var finalResult = (
      <Accordion>
        {result}
      </Accordion>
    );
    return finalResult;
  }

  // Handler for accordion-menu
  chooseCourse = (e, titleProps) => {
    const { index } = titleProps
    const { activeCourse } = this.state
    const newIndex = activeCourse === index ? -1 : index

    console.log("New active course "+newIndex);

    this.setState({ activeCourse: newIndex })
  }

  handleShowArchived(e) {
    e.preventDefault();
    const { showArchived } = this.state
    this.setState({ showArchived: !showArchived });
  }


  render() {
    var coursesMenu = this.renderCourses();
    var archivedText = "Prikaži arhivirane predmete";
    if (this.state.showArchived) archivedText = "Sakrij arhivirane predmete";

    return (
    <Container style={{ marginTop: '7em' }}>
      <Grid columns={2} divided>
        <Grid.Column width={5}>
          <Loader active={!this.state.fetchedCourses} inline='centered' />
          {coursesMenu}
          <a href="" onClick={this.handleShowArchived}>{archivedText}</a>
        </Grid.Column>
        <Grid.Column width={11}>
          <PrivateRoute path="/student" exact component={StudentHome} person={this.props.person} courses={this.state.courses} />
          <PrivateRoute path="/student/course/:course/:year" exact component={StudentCourse} person={this.props.person} courses={this.state.courses} />
          <PrivateRoute path="/student/homework/:course/:year/:scoringElement" exact component={StudentHomework} person={this.props.person} courses={this.state.courses} />
        </Grid.Column>
      </Grid>
    </Container>
    );
  }
}

export default StudentFrame
