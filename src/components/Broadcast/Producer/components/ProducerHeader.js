// @flow
import React from 'react';
import R from 'ramda';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../../Common/CopyToClipboard';
import createUrls from '../../../../services/eventUrls';
import { changeStatus } from '../../../../actions/broadcast';
import './ProducerHeader.css';

type BaseProps = {
  broadcast: BroadcastState,
  currentUser: User,
  showingSidePanel: boolean,
  toggleSidePanel: Unit
};

type DispatchProps = {
  goLive: string => void,
  endShow: string => void
};

type Props = BaseProps & DispatchProps;

const ProducerHeader = ({ broadcast, showingSidePanel, toggleSidePanel, currentUser, goLive, endShow }: Props): ReactComponent => {
  const event = R.defaultTo({})(broadcast.event);
  const { status } = event;
  const { connected } = broadcast;
  const { fanAudioUrl } = createUrls(event);

  return (
    <div className="ProducerHeader admin-page-header">
      <div className="ProducerHeader-info">
        <Link to="/admin">Back to Events</Link>
        <h3>{ event.name }</h3>
        <div className="post-production-url">
          <span className="label">POST-PRODUCTION URL:</span>
          <Link to={fanAudioUrl}>{fanAudioUrl}</Link>
          <CopyToClipboard text={fanAudioUrl} onCopyText="Post-Production URL" >
            <button className="btn white">COPY</button>
          </CopyToClipboard>
        </div>
      </div>
      <div className="ProducerHeader-controls">
        { status === 'preshow' &&
          <button className="btn white go-live" onClick={R.partial(goLive, [event.id])}>
            <Icon className="icon" name={connected ? 'circle' : 'spinner'} />
            { connected ? 'GO LIVE' : 'CONNECTING' }
          </button>
        }
        { status === 'live' &&
          <button className="btn red end-show" onClick={R.partial(endShow, [event.id])}>
            <Icon className="icon" name="times" />
            END SHOW
          </button>
        }
        <CopyToClipboard text={currentUser.id} onCopyText="Admin ID" >
          <button className="btn white">COPY ADMIN ID</button>
        </CopyToClipboard>
        <button className="btn white" onClick={toggleSidePanel}>
          <Icon name={showingSidePanel ? 'caret-square-o-right' : 'caret-square-o-left'} />
        </button>
      </div>
    </div>);
};
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    goLive: (id: string) => {
      dispatch(changeStatus(id, 'live'));
    },
    endShow: (id: string) => {
      dispatch(changeStatus(id, 'closed'));
    },
  });
const mapStateToProps = (state: State): Props => R.pick(['currentUser', 'broadcast'], state);
export default connect(mapStateToProps, mapDispatchToProps)(ProducerHeader);
