import { createImageVariantConfig, types as sdkTypes } from '../../util/sdkLoader';
import { isErrorUserPendingApproval, isForbiddenError, storableError } from '../../util/errors';

import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { toggleFavorite } from '../../ducks/user.duck';


const { UUID } = sdkTypes;

// ================ Action types ================ //

export const FETCH_FAVORITE_LISTINGS_REQUEST = 'app/FavoriteListingsPage/FETCH_FAVORITE_LISTINGS_REQUEST';
export const FETCH_FAVORITE_LISTINGS_SUCCESS = 'app/FavoriteListingsPage/FETCH_FAVORITE_LISTINGS_SUCCESS';
export const FETCH_FAVORITE_LISTINGS_ERROR = 'app/FavoriteListingsPage/FETCH_FAVORITE_LISTINGS_ERROR';
export const REMOVE_FAVORITE_LISTING_REQUEST = 'app/FavoriteListingsPage/REMOVE_FAVORITE_LISTING_REQUEST';
export const REMOVE_FAVORITE_LISTING_SUCCESS = 'app/FavoriteListingsPage/REMOVE_FAVORITE_LISTING_SUCCESS';
export const REMOVE_FAVORITE_LISTING_ERROR = 'app/FavoriteListingsPage/REMOVE_FAVORITE_LISTING_ERROR';

// ================ Reducer ================ //

const initialState = {
  queryInProgress: false,
  queryListingsError: null,
  currentPageResultIds: [],
  removeFavoriteInProgress: false,
  removeFavoriteError: null,
};

const resultIds = data => {
  const listings = data.data;
  return listings
    .filter(l => !l.attributes.deleted && l.attributes.state === 'published')
    .map(l => l.id);
};

const favoritePageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_FAVORITE_LISTINGS_REQUEST:
      return {
        ...state,
        queryInProgress: true,
        currentPageResultIds: [],
        queryListingsError: null,
      };
    case FETCH_FAVORITE_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        queryInProgress: false,
      };
    case FETCH_FAVORITE_LISTINGS_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, queryInProgress: false, queryListingsError: payload };

    case REMOVE_FAVORITE_LISTING_REQUEST:
      return {
        ...state,
        removeFavoriteInProgress: true,
        removeFavoriteError: null,
      };
    case REMOVE_FAVORITE_LISTING_SUCCESS:
      return {
        ...state,
        removeFavoriteInProgress: false,
      };
    case REMOVE_FAVORITE_LISTING_ERROR:
      // eslint-disable-next-line no-console
      console.error(payload);
      return { ...state, removeFavoriteInProgress: false, removeFavoriteError: payload };

    default:
      return state;
  }
};

export default favoritePageReducer;

// ================ Action creators ================ //

export const fetchFavoriteListingsRequest = () => ({
  type: FETCH_FAVORITE_LISTINGS_REQUEST,
});

export const fetchFavoriteListingsSuccess = response => ({
  type: FETCH_FAVORITE_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const fetchFavoriteListingsError = e => ({
  type: FETCH_FAVORITE_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const removeFavoriteListingRequest = () => ({
  type: REMOVE_FAVORITE_LISTING_REQUEST,
});

export const removeFavoriteListingSuccess = response => ({
  type: REMOVE_FAVORITE_LISTING_SUCCESS,
});

export const removeFavoriteListingError = e => ({
  type: REMOVE_FAVORITE_LISTING_ERROR,
  error: true,
  payload: e,
});

export const fetchFavoriteListings = ( params, search, config ) => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.reject(new Error('Favorite listings for anonimous users are not supported'));
  }

  const { favoriteListingIds = []} = currentUser?.attributes?.profile?.privateData || {};

  dispatch( fetchFavoriteListingsRequest());

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;
  const params = {
    ids: favoriteListingIds.map( id => new UUID( id )),
    perPage: 100,
    include: ['author', 'images'],
    'fields.listing': [
      'title',
      'price',
      'deleted',
      'state',
      'publicData.listingType',
      'publicData.transactionProcessAlias',
      'publicData.unitType',
      // These help rendering of 'purchase' listings,
      // when transitioning from search page to listing page
      'publicData.pickupEnabled',
      'publicData.shippingEnabled',
    ],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': [
      'variants.scaled-small',
      'variants.scaled-medium',
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    'limit.images': 1,
  };

  return sdk.listings
    .query(params)
    .then(response => {
      const listingFields = config?.listing?.listingFields;
      const sanitizeConfig = { listingFields };

      dispatch( addMarketplaceEntities( response, sanitizeConfig ));
      dispatch( fetchFavoriteListingsSuccess( response ));
      return response;
    })
    .catch(e => {
      const error = storableError( e );
      dispatch( fetchFavoriteListingsError( error ));
      if (!( isErrorUserPendingApproval(error) || isForbiddenError(error))) {
        throw e;
      }
    });
};

export const removeFavoriteListing = ( listingId, config ) => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.reject(new Error('Favorite listings for anonimous users are not supported'));
  }

  const { favoriteListingIds = []} = currentUser?.attributes?.profile?.privateData || {};

  dispatch( removeFavoriteListingRequest());

  return dispatch( toggleFavorite( listingId ))
    .then(response => {
      dispatch( fetchFavoriteListings({}, {}, config ));

      return dispatch( removeFavoriteListingSuccess());
    })
    .catch(e => {
      const error = storableError( e );
      dispatch( fetchFavoriteListingsError( error ));
      if (!( isErrorUserPendingApproval(error) || isForbiddenError(error))) {
        throw e;
      }
    });
};

export const loadData = ( params, search, config ) => (dispatch, getState, sdk) => {
  const fetchFavoriteListingsCall = fetchFavoriteListings( params, search, config );

  return dispatch( fetchFavoriteListingsCall );
};
