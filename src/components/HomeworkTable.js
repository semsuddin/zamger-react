import React, { Component } from 'react';
import { Table, Icon, Dimmer, Loader, Message } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import './HomeworkTable.css';
import Api from '../Api';
import Util from '../Util';

class HomeworkTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      homeworks: [],
      loadingHomeworks: true,
      homeworkError: '',
      stateString: ''
    };
    this.fetchHomeworks = this.fetchHomeworks.bind(this);
  }

  componentDidMount() {
    if (typeof this.props.person.id !== 'undefined') {
      var stateString = "" + this.props.person.id + "-" + this.props.course + "-" + this.props.year + "-" + this.props.activity;
      console.log("Fetching homeworks "+stateString);
      this.setState( { homeworks: [], loadingHomeworks: true, stateString: stateString } );
      this.fetchHomeworks();
    }
  }

  componentDidUpdate(prevProps) {
    // Person might not be known yet
    if (typeof this.props.person !== 'undefined' && typeof this.props.activity !== 'undefined') {
      var stateString = "" + this.props.person.id + "-" + this.props.course + "-" + this.props.year + "-" + this.props.activity;
      if (stateString !== this.state.stateString) {
        console.log("Fetching homeworks "+stateString);
        this.setState( { homeworks: [], loadingHomeworks: true, stateString: stateString } );
        this.fetchHomeworks();
      }
    }
  }

  fetchHomeworks() {
    var self = this;
    var url = "homework/course/" + this.props.course + "/student/" + this.props.person.id;
    //var url = "homework/course/" + this.props.course + "/student/6234";
    url += "?year=" + this.props.year + "&scoringElement=" + this.props.activity + "&resolve[]=Homework";

    Api.requestJson(url).then(function(result) {
      if (result.success && result.success === "false") {
        throw new Error();
      }
      self.setState( { homeworks: result.results, loadingHomeworks: false } );
    }).catch(function(error) {
      self.setState( { homeworkError: 'Greška prilikom preuzimanja rezultata zadaća' } );
    });
  }


  // TODO: Implement "render_withoud_sending" - a different table design for courses where submitting homework is not supported

  render_with_sending() {
    const { homeworks, loadingHomeworks, homeworkError } = this.state
    var key=1;
    var self=this;

    if (homeworks.length === 0) {
      return ( <div>Trenutno nema registrovanih zadaća.</div> );
    }

    // Find number of columns in table
    var maxAssignments = 1;
    homeworks.forEach(function(homework) {
      if (homework.Homework.nrAssignments > maxAssignments) maxAssignments = homework.Homework.nrAssignments;
    });

    // Render central part of table
    var homeworkTable = [], homeworkRow = [];
    var lastHomeworkId = 0, lastHomeworkAsgn = 0, lastHomeworkDeadline = 0, totalScore = 0, totalHomework = 0, possibleScore = 0, possibleHomework = 0;
    var createIcon = "create_new";
    var createText = "Novi zadatak";
    var commentIcon = "comment_yellow";
    var commentText = "Ima komentar";
    var pdfIcon = "pdf";
    var statusIcon = [ "bug", "view", "copy", "bug", "view", "ok" ];
    var statusText = [ "Bug u programu", "Pregled u toku", "Zadaća prepisana", "Bug u programu", "Pregled u toku", "Zadaća OK" ];
    var iconPath = "https://zamger.etf.unsa.ba/static/images/16x16/";
    var pdfLink = "https://zamger.etf.unsa.ba/?sta=student/zadacapdf&amp;zadaca=";
    var hasComment = '';
    var homeworkUrl = "/student/homework/" + this.props.course + "/" + this.props.year + "/" + this.props.activity;
    var tdClass = 'zadace';

    homeworks.forEach(function(homework) {
      if (lastHomeworkId > 0 && lastHomeworkId !== homework.Homework.id) {
        // Add empty cells if current homework has less assignments than maximum
        for (i=lastHomeworkAsgn; i<maxAssignments; i++)
          homeworkRow.push( <td key={key++}>&nbsp;</td> );
        if (self.props.summary) {
          homeworkRow.push( <td key={key++}>{totalHomework}</td> );
          homeworkRow.push( <td key={key++}>{possibleHomework}</td> );
          homeworkRow.push( <td key={key++}>
            <a href={pdfLink+lastHomeworkId} target="_new">
              <img src={iconPath+pdfIcon+".png"} width="16" height="16" border="0" title="PDF" alt="PDF" /></a>
          </td>
          );
        } else {
          var pd = new Date(lastHomeworkDeadline * 1000); // datetime is in seconds, but we need miliseconds
          tdClass = 'zadace';
          if (lastHomeworkDeadline < Date.now()) tdClass = 'rok-istekao';
          homeworkRow.push( <td key={key++} className={tdClass}>
              {Util.zeroPad(pd.getDate(),2)}. {Util.zeroPad(pd.getMonth()+1,2)}. {pd.getFullYear()}. {Util.zeroPad(pd.getHours(),2)}:{Util.zeroPad(pd.getMinutes(),2)}:{Util.zeroPad(pd.getSeconds(),2)}
            </td>
          );
        }

        homeworkTable.push( <tr key={key++}>{homeworkRow}</tr> );

        homeworkRow = [];
        homeworkRow.push( <th key={key++}>{homework.Homework.name}</th> );
        totalScore += totalHomework;
        possibleScore += possibleHomework;
        totalHomework = possibleHomework = 0;
      } else if (lastHomeworkId === 0) {
        homeworkRow.push( <th key={key++}>{homework.Homework.name}</th> );        
      }

      lastHomeworkId = homework.Homework.id;
      lastHomeworkAsgn = homework.assignNo;
      totalHomework += homework.score;
      possibleHomework = homework.Homework.maxScore;
      lastHomeworkDeadline = homework.Homework.deadline;

      tdClass = '';
      if (homework.Homework.id === self.props.currentHomework && homework.assignNo === self.props.currentAssignment) tdClass = 'trenutna-zadaca';

      if (homework.id === null) {
        homeworkRow.push( <td key={key++} className={tdClass}>
          <Link to={{ pathname: homeworkUrl, state: { currentHomework: homework.Homework.id, currentAssignment: homework.assignNo } }}>
            <img src={iconPath+createIcon+".png"} width="16" height="16" border="0" align="center" title={createText} alt={createText} />
          </Link>
          </td> 
        );
      } else {
        if (homework.comment && homework.comment.length > 0)
          hasComment = ( <img src={iconPath+commentIcon+".png"}  width="15" height="14" border="0" title={commentText} alt={commentText} align="center" /> );
        else
          hasComment = '';

        homeworkRow.push( <td key={key++} className={tdClass}>
          <Link to={{ pathname: homeworkUrl, state: { currentHomework: homework.Homework.id, currentAssignment: homework.assignNo } }}>
            <img src={iconPath+statusIcon[homework.status]+".png"} width="16" height="16" border="0" align="center" title={statusText[homework.status]} alt={statusText[homework.status]} />
            &nbsp; {homework.score}
            &nbsp; {hasComment}
          </Link>
          </td> 
        );
      }
    });

    // Once more
    if (lastHomeworkId > 0) {
      // Add empty cells if current homework has less assignments than maximum
      for (var i=lastHomeworkAsgn; i<maxAssignments; i++)
        homeworkRow.push( <td key={key++}>&nbsp;</td> );
      if (self.props.summary) {
        homeworkRow.push( <td key={key++}>{totalHomework}</td> );
        homeworkRow.push( <td key={key++}>{possibleHomework}</td> );
        homeworkRow.push( <td key={key++}>
          <a href={pdfLink+lastHomeworkId} target="_new">
            <img src={iconPath+pdfIcon+".png"} width="16" height="16" border="0" title="PDF" alt="PDF" /></a>
        </td>
        );
      } else {
        var pd = new Date(lastHomeworkDeadline * 1000); // datetime is in seconds, but we need miliseconds
        tdClass = 'zadace';
        if (lastHomeworkDeadline < Date.now()) tdClass = 'rok-istekao';
        homeworkRow.push( <td key={key++} className={tdClass}>
            {Util.zeroPad(pd.getDate(),2)}. {Util.zeroPad(pd.getMonth()+1,2)}. {pd.getFullYear()}. {Util.zeroPad(pd.getHours(),2)}:{Util.zeroPad(pd.getMinutes(),2)}:{Util.zeroPad(pd.getSeconds(),2)}
          </td>
        );
      }

      homeworkTable.push( <tr key={key++}>{homeworkRow}</tr> );
      totalScore += totalHomework;
      possibleScore += possibleHomework;
    }

    // Totals row
    if (self.props.summary) {
      homeworkTable.push (
        <tr key={key++}>
          <td colSpan={maxAssignments+1} align="right">UKUPNO: </td>
          <td>{totalScore}</td>
          <td>{possibleScore}</td>
          <td>&nbsp;</td>
        </tr>
      );
    }


    // Render header
    var tableHeader = [];
    for (i=1; i<=maxAssignments; i++) {
      tableHeader.push( <td key={key++}>Zadatak {i}.</td> )
    }
    if (self.props.summary) {
      tableHeader.push( <td key={key++}><b>Ukupno bodova</b></td> )
      tableHeader.push( <td key={key++}><b>Mogućih</b></td> )
      tableHeader.push( <td key={key++}><b>PDF</b></td> )

    } else {
      tableHeader.push( <td key={key++}><b>Rok za slanje</b></td> )
    }

    return (
      <div>
        <Message negative hidden={homeworkError === ''} header={homeworkError} />
        <p><b>{this.props.activityName}:</b></p>
        <Dimmer.Dimmable dimmed={true}>
        <Dimmer active={loadingHomeworks} inverted>
          <Loader />     
        </Dimmer>
        <table cellSpacing="0" cellPadding="2" border="0" id="zadace<?=$id_komponente?>" className="zadace">
          <thead>
            <tr>
              <td>&nbsp;</td>
              {tableHeader}
            </tr>
          </thead>
          <tbody>
            {homeworkTable}
          </tbody>
        </table>
        </Dimmer.Dimmable>
      </div>
    );
    //      <a href="#" onClick={window.open('https://zamger.etf.unsa.ba/legenda-zadace.html','blah6','width=320,height=130')}>Legenda simbola</a></p>
  }

  render_semantic() {
   
    return (
    <Table celled compact='very'>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>&nbsp;</Table.HeaderCell>
        <Table.HeaderCell>Zadatak 1</Table.HeaderCell>
        <Table.HeaderCell>Zadatak 2</Table.HeaderCell>
        <Table.HeaderCell>Zadatak 3</Table.HeaderCell>
        <Table.HeaderCell>Zadatak 4</Table.HeaderCell>
        <Table.HeaderCell>Ukupno bodova</Table.HeaderCell>
        <Table.HeaderCell>Mogućih</Table.HeaderCell>
      </Table.Row>
    </Table.Header>

    <Table.Body>
      <Table.Row>
        <Table.HeaderCell>Zadaća 1</Table.HeaderCell>
        <Table.Cell>
          <Icon name='idea' size='large' />
        </Table.Cell>
        <Table.Cell>
          <Icon color='green' name='checkmark' size='large' /> 0,5
        </Table.Cell>
        <Table.Cell>
          <Icon color='green' name='checkmark' size='large' /> 0,5 <Icon name='comment outline' size='large' />
        </Table.Cell>
        <Table.Cell>
          <Icon color='green' name='checkmark' size='large' /> 0,5
        </Table.Cell>
        <Table.Cell>
          <b>1,5</b>
        </Table.Cell>
        <Table.Cell>
          <b>2</b>
        </Table.Cell>
     </Table.Row>
      <Table.Row>
        <Table.HeaderCell>Zadaća 2</Table.HeaderCell>
        <Table.Cell>
          <Icon color='green' name='checkmark' size='large' /> 0,5 <Icon name='comment outline' size='large' />
        </Table.Cell>
        <Table.Cell>
          <Icon name='idea' size='large' />
        </Table.Cell>
        <Table.Cell>
          <Icon color='red' name='bug' size='large' /> 0
        </Table.Cell>
        <Table.Cell>
          <Icon name='idea' size='large' />
        </Table.Cell>
        <Table.Cell>
          <b>0,5</b>
        </Table.Cell>
        <Table.Cell>
          <b>2</b>
        </Table.Cell>
     </Table.Row>
      <Table.Row>
        <Table.HeaderCell>Zadaća 3</Table.HeaderCell>
        <Table.Cell>
          <Icon name='copy' size='large' /> 0 <Icon name='comment outline' size='large' />
        </Table.Cell>
        <Table.Cell>
          <Icon name='copy' size='large' /> 0 <Icon name='comment outline' size='large' />
        </Table.Cell>
        <Table.Cell>
          <Icon color='green' name='checkmark' size='large' /> 0,7 <Icon name='comment outline' size='large' />
        </Table.Cell>
        <Table.Cell />
        <Table.Cell>
          <b>0,7</b>
        </Table.Cell>
        <Table.Cell>
          <b>2</b>
        </Table.Cell>
     </Table.Row>
     <Table.Row>
        <Table.Cell colSpan='5' textAlign='right'>
          UKUPNO:
        </Table.Cell>
        <Table.Cell>
          3,2
        </Table.Cell>
        <Table.Cell>
          6
        </Table.Cell>
     </Table.Row>
    </Table.Body>
  </Table>
    );
  }

  render() {
    return this.render_with_sending();
  }
}

export default HomeworkTable
