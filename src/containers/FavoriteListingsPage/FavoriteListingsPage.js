import React from 'react';
import { arrayOf, bool, func, object, shape, string } from 'prop-types';
import { useHistory } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import {
  H3,
  Page,
  UserNav,
  LayoutSingleColumn,
  NamedLink,
  ListingCard,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { getListingsById } from '../../ducks/marketplaceData.duck';
import { removeFavoriteListing } from './FavoriteListingsPage.duck';
import css from './FavoriteListingsPage.module.css';

const Heading = props => {
  const { listingsAreLoaded, listings } = props;
  const hasResults = listingsAreLoaded && listings.length > 0;
  const hasNoResults = listingsAreLoaded && listings.length === 0;

  return hasResults ? (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage
        id="FavoriteListingsPage.youHaveListings"
        values={{ count: listings.length }}
      />
    </H3>
  ) : hasNoResults ? (
    <div className={css.noResultsContainer}>
      <H3 as="h1" className={css.headingNoListings}>
        <FormattedMessage id="FavoriteListingsPage.noResults" />
      </H3>
    </div>
  ) : null;
};

export const FavoriteListingsPageComponent = props => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  const {
    currentUser,
    listings,
    queryInProgress,
    queryListingsError,
    scrollingDisabled,
    onToggleFavorite,
  } = props;

  const listingsAreLoaded = !queryInProgress && listings;

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.loadingFavoriteListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.queryError" />
      </H3>
    </div>
  );

  const panelWidth = 62.5;
  // Render hints for responsive image
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  return (
    <Page
      title={intl.formatMessage({ id: 'FavoriteListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav currentPage="FavoriteListingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        {queryInProgress ? loadingResults : null}
        {queryListingsError ? queryError : null}

        <div className={css.listingPanel}>
          <Heading listingsAreLoaded={listingsAreLoaded} listings={listings} />

          <div className={css.listingCards}>
            {listings.map(l => (
              <ListingCard
                className={css.listingCard}
                history={history}
                key={l.id.uuid}
                listing={l}
                currentUser={currentUser}
                routeConfiguration={routeConfiguration}
                renderSizes={renderSizes}
                setActiveListing={() => {}}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

FavoriteListingsPageComponent.defaultProps = {
  currentUser: null,
  listings: [],
  queryInProgress: null,
  queryListingsError: null,
};

FavoriteListingsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  listings: arrayOf(propTypes.listing),
  queryInProgress: bool.isRequired,
  queryListingsError: propTypes.error,
  queryParams: object,
  scrollingDisabled: bool.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    currentPageResultIds,
    queryInProgress,
    queryListingsError,
  } = state.FavoriteListingsPage;
  const listings = getListingsById(state, currentPageResultIds);
  return {
    currentUser,
    currentPageResultIds,
    listings,
    queryInProgress,
    queryListingsError,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onToggleFavorite: ( listingId, config ) =>
    dispatch( removeFavoriteListing( listingId, config )),
});

const FavoriteListingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(FavoriteListingsPageComponent);

export default FavoriteListingsPage;
