import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import Api from './Api';
import Loading from './containers/Loading';
import Login from './containers/Login';
import StudentFrame from './containers/StudentFrame';
import AdminHome from './containers/AdminHome';
import StudentskaHome from './containers/StudentskaHome';
import NastavnikHome from './containers/NastavnikHome';
import Inbox from './containers/Inbox';
import Compose from './containers/Compose';
import NotFound from './containers/NotFound';

const PrivateRoute = ({ component: Component, person, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      Api.isLoggedIn ? (
        <Component {...props} person={person} />
      ) : (
        <Redirect
          to={{
            pathname: '/login',
            state: { from: props.location },
          }}
        />
      )
    }
  />
);

export default (props) =>
  <Switch>
    <PrivateRoute path="/" exact component={Loading} />
    <Route path="/login" exact render={() => { return <Login loginHandler={props.loginHandler} />; } } />
    <PrivateRoute path="/admin" exact component={AdminHome} />
    <PrivateRoute path="/studentska" exact component={StudentskaHome} />
    <PrivateRoute path="/nastavnik" exact component={NastavnikHome} />
    <PrivateRoute path="/student" component={StudentFrame} person={props.person} />

    <PrivateRoute path="/inbox" exact component={Inbox} person={props.person} />
    <PrivateRoute path="/inbox/compose" exact component={Compose} person={props.person} />
    <PrivateRoute path="/inbox/:msgid" exact component={Inbox} person={props.person} />
    <PrivateRoute path="/outbox" exact component={Inbox} person={props.person} />
    <PrivateRoute path="/outbox/:msgid" exact component={Inbox} person={props.person} />
    <PrivateRoute path="/inbox/compose/:msgid" exact component={Compose} person={props.person} />
    <Route component={NotFound} />
  </Switch>;
