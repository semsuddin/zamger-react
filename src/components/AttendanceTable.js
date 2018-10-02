import React, { Component } from 'react';
import { Message, Loader } from 'semantic-ui-react';
import './AttendanceTable.css';
import Api from '../Api';
import Util from '../Util';

class AttendanceTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attendance: [],
      loadingAttendance: true,
      attendanceError: '',
      stateString: ''
    };
    this.fetchAttendance = this.fetchAttendance.bind(this);
  }

  componentDidMount() {
    if (typeof this.props.person !== 'undefined') {
      var stateString = "" + this.props.person.id + "-" + this.props.course + "-" + this.props.year + "-" + this.props.activity;
      console.log("Fetching attendance "+stateString);
      this.setState( { attendance: [], loadingAttendance: true, stateString: stateString } );
      this.fetchAttendance();
    }
  }

  componentDidUpdate(prevProps) {
    // Person might not be known yet
    if (typeof this.props.person !== 'undefined') {
      var stateString = "" + this.props.person.id + "-" + this.props.course + "-" + this.props.year + "-" + this.props.activity;
      if (stateString !== this.state.stateString) {
        console.log("Fetching attendance "+stateString);
        this.setState( { attendance: [], loadingAttendance: true, stateString: stateString } );
        this.fetchAttendance();
      }
    }
  }

  fetchAttendance() {
    var self = this;
    // Find group for student
    var url = "class/course/" + this.props.course + "/student/" + this.props.person.id;
    //var url = "class/course/" + this.props.course + "/student/6234";
    url += "?year=" + this.props.year + "&scoringElement=" + this.props.activity + "&resolve[]=Group&resolve[]=ZClass";

    Api.requestJson(url).then(function(result) {
      if (result.success && result.success === "false") {
        throw new Error();
      }

      self.setState( { attendance: result.results, loadingAttendance: false } );
    }).catch(function(error) {
      self.setState( { attendanceError: 'Greška prilikom preuzimanja podataka o prisustvu', loadingAttendance: false } );
    });
  }


  // TODO: Implement "render_withoud_sending" - a different table design for courses where submitting homework is not supported

  render() {
    const { attendance, loadingAttendance, attendanceError } = this.state
    var key=1;
    var self=this;

    // Find groups
    var presenceContent = [];
    attendance.forEach(function(group) {
      var dateList = [], timeList = [], statusList = [];
      group.attendance.forEach(function(zclass) {
        var pd = new Date(zclass.ZClass.datetime*1000); // datetime is in seconds, but we need miliseconds
        var tdClass, status;
        if(zclass.presence === 1) {
          tdClass = "prisutan"; status = "DA";
        } else if (zclass.presence === 0) {
          tdClass = "odsutan"; status = "NE";
        } else {
          tdClass = "nepoznato"; status = "/";          
        }
        dateList.push( <td key={key++}>{Util.zeroPad(pd.getDate(),2)}.{Util.zeroPad(pd.getMonth()+1,2)}</td> );
        timeList.push( <td key={key++}>{Util.zeroPad(pd.getHours(),2)}<sup>{Util.zeroPad(pd.getMinutes(),2)}</sup></td> );
        statusList.push( <td key={key++} className={tdClass}>{status}</td> );
      });

      presenceContent.push(
        <div key={key++}>
          <p><b>{self.props.activityName} ({group.Group.name}):</b></p>
          <table cellSpacing="0" cellPadding="2" border="0" id="prisustvo" className="prisustvo">
          <tbody>
            <tr>
              <th>Datum</th>
              {dateList}
            </tr>
            <tr>
              <th>Vrijeme</th>
              {timeList}
            </tr>
            <tr>
              <th>Prisutan</th>
              {statusList}
            </tr>
          </tbody>
          </table>
        </div>
      );
    });

    return (
      <div>
        <Message negative hidden={attendanceError === ''} header={attendanceError} />
        <Loader active={loadingAttendance} inline='centered' />
        {presenceContent}
      </div>
    );
    //      <a href="#" onClick={window.open('https://zamger.etf.unsa.ba/legenda-zadace.html','blah6','width=320,height=130')}>Legenda simbola</a></p>
  }

}

export default AttendanceTable
