// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import ProducerHeader from './components/ProducerHeader';
import ProducerSidePanel from './components/ProducerSidePanel';
import ProducerPrimary from './components/ProducerPrimary';
import ProducerChat from './components/ProducerChat';
import { setBroadcastEvent, resetBroadcastEvent } from '../../../actions/broadcast';
import { changeVolume } from '../../../services/opentok';
import './Producer.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: string } };
type BaseProps = {
  user: User,
  eventId: EventId,
  broadcast: BroadcastState
};
type DispatchProps = {
  setEvent: EventId => void,
  resetEvent: Unit
};

type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class Producer extends Component {
  props: Props;
  state: { preshowStarted: boolean, showingSidePanel: boolean };
  startPreshow: Unit;
  toggleSidePanel: Unit;
  signalListener: Signal => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      preshowStarted: false,
      showingSidePanel: true,
    };
    this.toggleSidePanel = this.toggleSidePanel.bind(this);
    this.signalListener = this.signalListener.bind(this);
  }

  signalListener({ type, data, from }: Signal) {
    const signalData = data ? JSON.parse(data) : {};
    console.log('get me some signal data here', signalData);
    const fromData = JSON.parse(from.data);
    const fromProducer = fromData.userType === 'producer';
    switch (type) {
      case 'signal:changeVolume':
        fromProducer && changeVolume(signalData.userType, signalData.volume, true);
        break;
      default:
        break;
    }
  }

  toggleSidePanel() {
    this.setState({ showingSidePanel: !this.state.showingSidePanel });
  }

  componentDidMount() {
    const { setEvent, eventId } = this.props;
    setEvent(eventId, this.signalListener);
  }

  componentWillUnmount() {
    this.props.resetEvent();
  }

  render(): ReactComponent {
    const { toggleSidePanel } = this;
    const { showingSidePanel } = this.state;
    return (
      <div className="Producer">
        <div className={classNames('Producer-main', { full: !showingSidePanel })} >
          <ProducerHeader showingSidePanel={showingSidePanel} toggleSidePanel={toggleSidePanel} />
          <ProducerPrimary />
        </div>
        <ProducerSidePanel hidden={!showingSidePanel} />
        <ProducerChat />
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  eventId: R.pathOr('', ['params', 'id'], ownProps),
  broadcast: R.prop('broadcast', state),
  user: R.prop('currentUser', state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    setEvent: (eventId: EventId, onSignal: Listener) => {
      dispatch(setBroadcastEvent(eventId, onSignal));
    },
    resetEvent: () => {
      dispatch(resetBroadcastEvent());
    },
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Producer));
