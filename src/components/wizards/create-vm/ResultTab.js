import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'patternfly-react';

const ResultTab = ({ result, successfull }) => {
  if (successfull == null) {
    return (
      <div className="wizard-pf-process blank-slate-pf">
        <div className="spinner spinner-lg blank-slate-pf-icon" />
        <h3 className="blank-slate-pf-main-action">Creation of VM in progress</h3>
      </div>
    );
  } else if (successfull) {
    return (
      <div className="wizard-pf-complete blank-slate-pf">
        <div className="wizard-pf-success-icon">
          <span className="glyphicon glyphicon-ok-circle" />
        </div>
        <h3 className="blank-slate-pf-main-action">Creation of VM was succesfull</h3>
        <p className="blank-slate-pf-secondary-action">{result}</p>
      </div>
    );
  }
  return <Alert>{result}</Alert>;
};

ResultTab.defaultProps = {
  result: null
};

ResultTab.propTypes = {
  result: PropTypes.string,
  successfull: PropTypes.bool.isRequired
};

export default ResultTab;
