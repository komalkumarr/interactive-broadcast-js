// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import { setBroadcastEventStatus } from '../../../actions/broadcast';
import { initializeBroadcast, getInLine, leaveTheLine, setPublisherMinimized } from '../../../actions/fan';
import FanHeader from './components/FanHeader';
import FanBody from './components/FanBody';
import FanStatusBar from './components/FanStatusBar';
import NoEvents from '../../Common/NoEvents';
import Loading from '../../../components/Common/Loading';
import Chat from '../../../components/Common/Chat';
import NetworkReconnect from '../../Common/NetworkReconnect';
import { disconnect } from '../../../services/opentok';
import './Fan.css';

/* beautify preserve:start */
type InitialProps = { params: { fanUrl: string, adminId: string } };
type BaseProps = {
  adminId: string,
  userType: 'host' | 'celeb',
  userUrl: string,
  event: null | BroadcastEvent,
  inPrivateCall: boolean,
  status: EventStatus,
  broadcast: BroadcastState,
  backstageConnected: boolean,
  participants: BroadcastParticipants,
  fanStatus: FanStatus,
  producerChat: ChatState,
  ableToJoin: boolean,
  disconnected: boolean,
  postProduction: boolean,
  authError: Error,
  isEmbed: boolean,
  publisherMinimized: boolean
};
type DispatchProps = {
  init: FanInitOptions => void,
  changeEventStatus: EventStatus => void,
  joinLine: Unit,
  leaveLine: Unit,
  minimizePublisher: Unit,
  restorePublisher: Unit
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class Fan extends Component {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;

  componentDidMount() {
    const { adminId, userType, userUrl, init, fitMode } = this.props;
    const options = {
      adminId,
      userType,
      userUrl,
      fitMode,
    };
    init(options);
  }

  componentWillReceiveProps(nextProps: Props) {
    // Need to check for change to event status here
    if (R.pathEq(['event', 'status'], 'closed', nextProps)) { disconnect(); }
  }

  render(): ReactComponent {
    const { // $FlowFixMe
      event,
      status,
      participants,
      inPrivateCall,
      broadcast,
      joinLine,
      leaveLine,
      backstageConnected,
      fanStatus,
      producerChat,
      ableToJoin,
      disconnected,
      postProduction,
      authError,
      isEmbed,
      publisherMinimized,
      minimizePublisher,
      restorePublisher,
    } = this.props;
    if (authError) return <NoEvents />;
    if (!event) return <Loading />;
    const participantIsConnected = (type: ParticipantType): boolean => R.path([type, 'connected'], participants || {});
    const hasStreams = R.any(participantIsConnected)(['host', 'celebrity', 'fan']);
    const isClosed = R.equals(status, 'closed');
    const isLive = R.equals(status, 'live');
    const mainClassNames = classNames('Fan', { FanEmbed: isEmbed });
    return (
      <div className={mainClassNames}>
        <NetworkReconnect />
        <div className="Container">
          <FanHeader
            name={event.name}
            status={status}
            ableToJoin={ableToJoin}
            getInLine={joinLine}
            postProduction={postProduction}
            leaveLine={leaveLine}
            fanStatus={fanStatus}
            backstageConnected={backstageConnected}
            inPrivateCall={inPrivateCall}
            privateCall={broadcast.privateCall}
            disconnected={disconnected}
          />
          { !isClosed && <FanStatusBar fanStatus={fanStatus} /> }
          <FanBody
            publisherMinimized={publisherMinimized}
            restorePublisher={restorePublisher}
            minimizePublisher={minimizePublisher}
            hasStreams={hasStreams}
            image={isClosed ? event.endImage : event.startImage}
            participants={participants}
            isClosed={isClosed}
            isLive={isLive}
            fanStatus={fanStatus}
            backstageConnected={backstageConnected}
            ableToJoin={ableToJoin}
            hlsUrl={event.hlsUrl}
            postProduction={postProduction}
          />
          <div className="FanChat" >
            { producerChat && <Chat chat={producerChat} /> }
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { fanUrl } = ownProps.params;
  return {
    fitMode: R.path(['location', 'query', 'fitMode'], ownProps),
    adminId: R.path(['params', 'adminId'], ownProps),
    userType: R.path(['route', 'userType'], ownProps),
    isEmbed: R.path(['route', 'embed'], ownProps),
    postProduction: R.path(['fan', 'postProduction'], state),
    userUrl: fanUrl,
    inPrivateCall: R.path(['fan', 'inPrivateCall'], state),
    event: R.path(['broadcast', 'event'], state),
    status: R.path(['broadcast', 'event', 'status'], state),
    broadcast: R.path(['broadcast'], state),
    participants: R.path(['broadcast', 'participants'], state),
    ableToJoin: R.path(['fan', 'ableToJoin'], state),
    fanStatus: R.path(['fan', 'status'], state),
    backstageConnected: R.path(['broadcast', 'backstageConnected'], state),
    producerChat: R.path(['broadcast', 'chats', 'producer'], state),
    disconnected: R.path(['broadcast', 'disconnected'], state),
    authError: R.path(['auth', 'error'], state),
    publisherMinimized: R.path(['fan', 'publisherMinimized'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  init: (options: FanInitOptions): void => dispatch(initializeBroadcast(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
  joinLine: (): void => dispatch(getInLine()),
  leaveLine: (): void => dispatch(leaveTheLine()),
  minimizePublisher: (): void => dispatch(setPublisherMinimized(true)),
  restorePublisher: (): void => dispatch(setPublisherMinimized(false)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Fan));
