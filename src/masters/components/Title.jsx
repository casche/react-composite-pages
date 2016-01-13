import React, { Children, Component, PropTypes } from 'react';
import withSideEffect from 'react-side-effect';

class Title extends Component {
    render() {
        if (this.props.children) {
            return Children.only(this.props.children);
        } else {
            return null;
        }
    }
}

Title.propTypes = {
    title: PropTypes.string.isRequired
};

function reducePropsToState(propsList) {
    const innermostProps = propsList[propsList.length - 1];

    if (innermostProps) {
        return innermostProps.title;
    }
}

function handleStateChangeOnClient(title) {
    document.title = title || '';
}

export default withSideEffect(
    reducePropsToState,
    handleStateChangeOnClient
)(Title);
