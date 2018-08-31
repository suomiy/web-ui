import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'patternfly-react';

import './ResultTab.css';

const ResultTab = ({ result, success }) => {
  if (success == null) {
    return (
      <div className="wizard-pf-process blank-slate-pf" key="progress">
        <div className="spinner spinner-lg blank-slate-pf-icon" />
        <h3 className="blank-slate-pf-main-action">Creation of VM in progress</h3>
      </div>
    );
  } else if (success) {
    return (
      <div className="wizard-pf-complete blank-slate-pf" key="success">
        <div className="wizard-pf-success-icon">
          <span className="glyphicon glyphicon-ok-circle" />
        </div>
        <h3 className="blank-slate-pf-main-action">Creation of VM was succesfull</h3>
        <pre className="blank-slate-pf-secondary-action description">{result}</pre>
      </div>
    );
  }
  return <Alert key="fail">{result}</Alert>;
};

ResultTab.defaultProps = {
  result: null,
  success: null
};

ResultTab.propTypes = {
  result: PropTypes.string,
  success: PropTypes.bool
};

export default ResultTab;
