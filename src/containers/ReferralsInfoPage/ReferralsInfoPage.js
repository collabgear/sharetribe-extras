import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import QRCode from 'react-qr-code';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import {
  Page, UserNav, H3, LayoutSideNavigation, Heading, NamedLink, ExternalLink
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ReferralsInfoPage.module.css';
import { ensureCurrentUser } from '../../util/data';

export const ReferralsInfoPageComponent = props => {
  const {
    fetchReferralsError,
    fetchReferralsInProgress,
    referralUser,
    refereeUsers,
    currentUser,
    scrollingDisabled,
    intl,
  } = props;

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!ensuredCurrentUser.id;
  const referralOwnId = ensuredCurrentUser?.attributes?.profile?.publicData?.referralOwnId;
  const referralOwnLink =
    `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/signup?referralId=${referralOwnId}`;

  const referralQrCode = (
    <div className={css.qrcodeWrapper}>
      <QRCode
        size={256}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        value={referralOwnLink}
        viewBox={`0 0 256 256`}
      />
    </div>
  );

  const title = intl.formatMessage({ id: 'ReferralsInfoPage.title' });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav currentPage="ReferralsInfoPage" />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        currentPage="ReferralsInfoPage"
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1">
            <FormattedMessage id="ReferralsInfoPage.heading" />
          </H3>

          { fetchReferralsError ? (
            <span className={css.error}>
              <FormattedMessage id="ReferralsInfoPage.genericFailure" />
            </span>
          ) : !currentUserLoaded || fetchReferralsInProgress ? (
            <FormattedMessage id="ReferralsInfoPage.loadingData" />
          ) : (
            <>
              <Heading as="h4" rootClassName={css.heading}>
                <FormattedMessage id="ReferralsInfoPage.ownReferralInfoHeading" />
              </Heading>
              <div className={css.text}>
                <span className={css.label}>
                  <FormattedMessage id="ReferralsInfoPage.ownReferralIdLabel" /> &nbsp;
                 </span>
                {referralOwnId}
              </div>

              <div className={css.text}>
                <span className={css.label}>
                  <FormattedMessage id="ReferralsInfoPage.ownReferralLinkLabel" /> &nbsp;
                </span>
                {referralOwnLink}
              </div>

              <div className={css.text}>
                <span className={css.label}>
                  <FormattedMessage id="ReferralsInfoPage.ownReferralQrCodeLabel" /> &nbsp;
                </span>
                {referralQrCode}
              </div>



              { referralUser ? (
                <>
                <Heading as="h4" rootClassName={css.heading}>
                  <FormattedMessage id="ReferralsInfoPage.referralHeading" />
                </Heading>

                  <NamedLink className={css.profileLink} name="ProfilePage" params={{ id: referralUser.id }}>
                    {referralUser.name}
                  </NamedLink>
                </>
              ) : null }

              { Array.isArray( refereeUsers ) && refereeUsers.length > 0 ? (
                <>
                  <Heading as="h4" rootClassName={css.heading}>
                    <FormattedMessage id="ReferralsInfoPage.refereesHeading" />
                  </Heading>

                  {refereeUsers.map( ru => (
                    <NamedLink className={css.profileLink} name="ProfilePage" params={{ id: ru.id }}>
                      {ru.name}
                    </NamedLink>
                  ))}
                </>
              ) : null }
            </>
          )}
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

ReferralsInfoPageComponent.defaultProps = {
  fetchReferralsError: null,
  fetchReferralsInProgress: false,
  referralUser: null,
  refereeUsers: [],
  currentUser: null,
};

const { bool, string, object, arrayOf } = PropTypes;

ReferralsInfoPageComponent.propTypes = {
  fetchReferralsError: propTypes.error,
  fetchReferralsInProgress: bool.isRequired,
  referralUserId: object,
  refereeUsers: arrayOf( object ),
  currentUser: propTypes.currentUser,
  scrollingDisabled: bool.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  // Topbar needs user info.
  const {
    fetchReferralsError,
    fetchReferralsInProgress,
    referralUser,
    refereeUsers,
  } = state.ReferralsInfoPage;
  const { currentUser } = state.user;
  return {
    fetchReferralsError,
    fetchReferralsInProgress,
    referralUser,
    refereeUsers,
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const ReferralsInfoPage = compose(
  connect(
    mapStateToProps
  ),
  injectIntl
)(ReferralsInfoPageComponent);

export default ReferralsInfoPage;
