import { fetchCurrentUser } from '../../ducks/user.duck';
import { readFileMetadataAsync } from '../../util/file-metadata';
import _ from 'lodash';
import { createUppyInstance } from '../../util/uppy';
import { convertUnitToSubUnit, truncateToSubUnitPrecision, unitDivisor } from '../../util/currency';
import { LISTING_TYPES } from '../../util/types';
import { parse } from '../../util/urlHelpers';
import { queryListingsError } from '../ManageListingsPage/ManageListingsPage.duck';
import { storableError } from '../../util/errors';
import { types as sdkTypes } from '../../util/sdkLoader';

const SMALL_IMAGE = 'small-image';
const MEDIUM_IMAGE = 'medium-image';
const LARGE_IMAGE = 'large-image';
const UNAVAILABLE_IMAGE_RESOLUTION = 'unavailable';
const USAGE_EDITORIAL = 'editorial';
const NO_RELEASES = 'no-release';

const AI_TERMS_STATUS_ACCEPTED = 'accepted';
const AI_TERMS_STATUS_REQUIRED = 'required';
const AI_TERMS_STATUS_NOT_REQUIRED = 'not-required';
const RESULT_PAGE_SIZE = 30;

export const PAGE_MODE_CREATE = 'create';
export const MAX_KEYWORDS = 30;
export const MAX_CATEGORIES = 5;

const { UUID } = sdkTypes;

export const IMAGE_DIMENSIONS_MAP = {
  [SMALL_IMAGE]: {
    maxDimension: 1000,
    label: 'Small (< 1,000px)',
  },
  [MEDIUM_IMAGE]: {
    maxDimension: 2000,
    label: 'Medium (1,000px-2,000px)',
  },
  [LARGE_IMAGE]: {
    maxDimension: 2001,
    label: 'Large (>2,000px)',
  },
  [UNAVAILABLE_IMAGE_RESOLUTION]: {
    label: 'Unavailable',
  },
};

function getDimensions(width, height) {
  if (!width && !height) {
    return UNAVAILABLE_IMAGE_RESOLUTION;
  }
  const largestDimension = Math.max(width, height);
  if (largestDimension <= IMAGE_DIMENSIONS_MAP[SMALL_IMAGE].maxDimension) {
    return SMALL_IMAGE;
  }
  if (largestDimension <= IMAGE_DIMENSIONS_MAP[MEDIUM_IMAGE].maxDimension) {
    return MEDIUM_IMAGE;
  }
  return LARGE_IMAGE;
}

function getListingFieldOptions(config, listingFieldKey) {
  const { listing } = config;
  const { listingFields } = listing;
  const { enumOptions } = listingFields.find(f => f.key === listingFieldKey);
  return enumOptions.map(({ label, option }) => ({ value: option, label }));
}

function listingsFromSdkResponse(sdkResponse) {
  const { data, included } = sdkResponse;
  return data.map(ownListing => {
    const images = ownListing.relationships.images;
    const image =
      images.data.length > 0 ? included.find(img => img.id.uuid === images.data[0].id.uuid) : null;
    const preview = image?.attributes?.variants?.default?.url;

    const keywords = ownListing.attributes.publicData.keywords;
    const keywordsArray = Array.isArray(keywords) ? keywords : keywords.split(',');

    const categories = ownListing.attributes.publicData.imageryCategory;
    const categoriesArray = Array.isArray(categories) ? categories : categories.split(',');

    return {
      id: ownListing.id.uuid,
      name: ownListing.attributes.publicData.originalFileName,
      title: ownListing.attributes.title,
      description: ownListing.attributes.description,
      keywords: keywordsArray,
      category: categoriesArray,
      usage: ownListing.attributes.publicData.usage,
      releases: ownListing.attributes.publicData.releases,
      dimensions: ownListing.attributes.publicData.imageSize,
      price: ownListing.attributes.price.amount / 100,
      isAi: ownListing.attributes.publicData.aiTerms === 'yes',
      preview,
    };
  });
}

function uppyFileToListing(file) {
  const { id, meta, name, size, preview, type } = file;

  const { keywords, height, width } = meta;
  const dimensions = getDimensions(width, height);

  let keywordsOptions = [];
  if (keywords) {
    keywordsOptions = Array.isArray(keywords) ? keywords : keywords.split(',');
  }

  return {
    key: id,
    id,
    name,
    title: name,
    description: null,
    keywords: keywordsOptions.slice(0, MAX_KEYWORDS),
    size,
    preview,
    category: [],
    usage: USAGE_EDITORIAL,
    releases: NO_RELEASES,
    price: null,
    dimensions: dimensions,
    isAi: false,
    isIllustration: false,
    type,
  };
}

function validateListingProperties(listing) {
  const requiredProperties = ['category', 'title', 'description', 'price'];
  const missingProperties = [];

  requiredProperties.forEach(property => {
    if (
      !listing[property] ||
      (Array.isArray(listing[property]) && listing[property].length === 0)
    ) {
      missingProperties.push(property);
    }
  });

  return missingProperties.length === 0 ? null : { listing, missingProperties };
}

function getListingCategory(listing) {
  const isVideo = listing.type.startsWith('video/');
  if (listing.isAi) return isVideo ? 'ai-video' : 'ai-image';
  if (listing.isIllustration) return 'illustrations';
  return isVideo ? 'videos' : 'photos';
}

// ================ Action types ================ //
export const INITIALIZE_UPPY = 'app/BatchEditListingPage/INITIALIZE_UPPY';

export const SET_LISTINGS_DEFAULTS = 'app/BatchEditListingPage/SET_LISTINGS_DEFAULTS';
export const SET_USER_ID = 'app/BatchEditListingPage/SET_USER_ID';

export const ADD_FILE = 'app/BatchEditListingPage/ADD_FILE';
export const REMOVE_FILE = 'app/BatchEditListingPage/REMOVE_FILE';
export const RESET_FILES = 'app/BatchEditListingPage/RESET_FILES';
export const UPDATE_LISTING = 'app/BatchEditListingPage/UPDATE_LISTING';

export const PREVIEW_GENERATED = 'app/BatchEditListingPage/PREVIEW_GENERATED';
export const FETCH_LISTING_OPTIONS = 'app/BatchEditListingPage/FETCH_LISTING_OPTIONS';
export const SET_INVALID_LISTINGS = 'app/BatchEditListingPage/SET_INVALID_LISTINGS';
export const SET_AI_TERMS_ACCEPTED = 'app/BatchEditListingPage/SET_AI_TERMS_ACCEPTED';
export const SET_AI_TERMS_REQUIRED = 'app/BatchEditListingPage/SET_AI_TERMS_REQUIRED';
export const SET_AI_TERMS_NOT_REQUIRED = 'app/BatchEditListingPage/SET_AI_TERMS_NOT_REQUIRED';

export const SAVE_LISTINGS_REQUEST = 'app/BatchEditListingPage/SAVE_LISTINGS_REQUEST';
export const SAVE_LISTINGS_ERROR = 'app/BatchEditListingPage/SAVE_LISTINGS_ERROR';
export const SAVE_LISTINGS_ABORTED = 'app/BatchEditListingPage/SAVE_LISTINGS_ABORTED';
export const SAVE_LISTINGS_SUCCESS = 'app/BatchEditListingPage/SAVE_LISTINGS_SUCCESS';

export const SET_SELECTED_ROWS = 'app/BatchEditListingPage/SET_SELECTED_ROWS';
export const ADD_FAILED_LISTING = 'app/BatchEditListingPage/ADD_FAILED_LISTING';
export const ADD_SUCCESSFUL_LISTING = 'app/BatchEditListingPage/ADD_SUCCESSFUL_LISTING';

export const RESET_STATE = 'app/BatchEditListingPage/RESET_STATE';

export const FETCH_LISTINGS_FOR_EDIT_REQUEST =
  'app/BatchEditListingPage/FETCH_LISTINGS_FOR_EDIT_REQUEST';
export const FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS =
  'app/BatchEditListingPage/FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS';

// ================ Reducer ================ //
const initialState = {
  listings: [],
  uppy: null,
  listingFieldsOptions: {
    categories: [],
    usages: [],
  },
  invalidListings: [],
  selectedRowsKeys: [],
  aiTermsStatus: AI_TERMS_STATUS_NOT_REQUIRED,
  saveListingsInProgress: false,
  createListingsSuccess: null,
  userId: null,
  failedListings: [],
  successfulListings: [],
  listingCategory: null,
  queryParams: [],
  queryInProgress: false,
  queryListingsError: null,
  listingDefaults: {
    currency: 'USD',
    transactionType: {
      process: 'default-purchase',
      alias: 'default-purchase/release-1',
      unitType: 'item',
    },
  },
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case SET_USER_ID:
      return { ...state, userId: payload };
    case SET_LISTINGS_DEFAULTS:
      return { ...state, listingDefaults: payload };
    case INITIALIZE_UPPY:
      return { ...state, uppy: payload.uppy, listings: payload.files };
    case ADD_FILE:
      return {
        ...state,
        listings: [...state.listings, payload],
        selectedRowsKeys: _.uniq([...state.selectedRowsKeys, payload.id]),
      };
    case REMOVE_FILE:
      return {
        ...state,
        listings: state.listings.filter(file => file.id !== payload.id),
        selectedRowsKeys: state.selectedRowsKeys.filter(key => key !== payload.id),
      };
    case RESET_FILES:
      return { ...state, listings: [], selectedRowsKeys: [] };
    case PREVIEW_GENERATED: {
      const { id, preview } = payload;
      return {
        ...state,
        listings: state.listings.map(listing =>
          listing.id === id
            ? {
                ...listing,
                preview,
              }
            : listing
        ),
      };
    }
    case FETCH_LISTING_OPTIONS: {
      const { categories, usages, releases } = payload;
      return {
        ...state,
        listingFieldsOptions: {
          categories,
          usages,
          releases,
        },
      };
    }
    case UPDATE_LISTING: {
      const { id, ...values } = payload;
      return {
        ...state,
        listings: state.listings.map(file => (file.id === id ? { ...file, ...values } : file)),
      };
    }
    case SET_INVALID_LISTINGS:
      return { ...state, invalidListings: payload };

    case SET_AI_TERMS_ACCEPTED:
      return { ...state, aiTermsStatus: AI_TERMS_STATUS_ACCEPTED };
    case SET_AI_TERMS_REQUIRED:
      return { ...state, aiTermsStatus: AI_TERMS_STATUS_REQUIRED };
    case SET_AI_TERMS_NOT_REQUIRED:
      return { ...state, aiTermsStatus: AI_TERMS_STATUS_NOT_REQUIRED };

    case SET_SELECTED_ROWS:
      return { ...state, selectedRowsKeys: payload };

    case SAVE_LISTINGS_REQUEST:
      return { ...state, saveListingsInProgress: true };

    case SAVE_LISTINGS_ERROR:
      return {
        ...state,
        createListingsSuccess: false,
        saveListingsInProgress: false,
        selectedRowsKeys: [],
      };
    case SAVE_LISTINGS_ABORTED:
      return {
        ...state,
        createListingsSuccess: null,
        saveListingsInProgress: false,
        invalidListings: [],
      };
    case SAVE_LISTINGS_SUCCESS:
      return {
        ...state,
        createListingsSuccess: true,
        saveListingsInProgress: false,
        selectedRowsKeys: [],
      };
    case ADD_FAILED_LISTING:
      return { ...state, failedListings: [...state.failedListings, payload] };
    case ADD_SUCCESSFUL_LISTING:
      return { ...state, successfulListings: [...state.successfulListings, payload] };
    case RESET_STATE:
      return initialState;
    case FETCH_LISTINGS_FOR_EDIT_REQUEST:
      return {
        ...state,
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryListingsError: null,
      };
    case FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS:
      return {
        ...state,
        queryInProgress: false,
        queryListingsError: null,
        listings: listingsFromSdkResponse(payload.data),
      };
    default:
      return state;
  }
}

// ============== Selector =============== //
export const getUppyInstance = state => state.BatchEditListingPage.uppy;
export const getListings = state => state.BatchEditListingPage.listings;
export const getSingleListing = (state, id) =>
  state.BatchEditListingPage.listings.find(l => l.id === id);
export const getInvalidListings = state => state.BatchEditListingPage.invalidListings;
export const getListingFieldsOptions = state => state.BatchEditListingPage.listingFieldsOptions;
export const getSelectedRowsKeys = state => state.BatchEditListingPage.selectedRowsKeys;

export const getListingCreationInProgress = state =>
  state.BatchEditListingPage.saveListingsInProgress;
export const getAiTermsRequired = state =>
  state.BatchEditListingPage.aiTermsStatus === AI_TERMS_STATUS_REQUIRED;
export const getAiTermsAccepted = state =>
  state.BatchEditListingPage.aiTermsStatus === AI_TERMS_STATUS_ACCEPTED;

export const getCreateListingsSuccess = state => state.BatchEditListingPage.createListingsSuccess;
export const getFailedListings = state => state.BatchEditListingPage.failedListings;
export const getSaveListingData = state => {
  const {
    failedListings,
    successfulListings,
    selectedRowsKeys,
    saveListingsInProgress,
  } = state.BatchEditListingPage;
  return {
    failedListings,
    successfulListings,
    selectedRowsKeys,
    saveListingsInProgress,
  };
};
export const getListingsDefaults = state => state.BatchEditListingPage.listingDefaults;
export const getIsQueryInProgress = state => state.BatchEditListingPage.queryInProgress;

function updateAiTermsStatus(getState, dispatch) {
  if (getAiTermsAccepted(getState())) {
    return;
  }
  const listings = getListings(getState());
  const hasAi = listings.some(listing => listing.isAi);
  dispatch({ type: hasAi ? SET_AI_TERMS_REQUIRED : SET_AI_TERMS_NOT_REQUIRED });
}

function getOnBeforeUpload(getState) {
  return files => {
    // Use the onBeforeUpload event to filter out files that are not selected
    const selectedFilesIds = getSelectedRowsKeys(getState());

    return selectedFilesIds.reduce((acc, key) => {
      if (key in files) {
        acc[key] = files[key];
      }
      return acc;
    }, {});
  };
}

// ================ Thunk ================ //
export function initializeUppy(meta) {
  return (dispatch, getState, sdk) => {
    createUppyInstance(meta, getOnBeforeUpload(getState)).then(uppyInstance => {
      dispatch({
        type: INITIALIZE_UPPY,
        payload: { uppy: uppyInstance, files: uppyInstance.getFiles().map(uppyFileToListing) },
      });

      uppyInstance.on('file-removed', file => {
        dispatch({ type: REMOVE_FILE, payload: file });
        updateAiTermsStatus(getState, dispatch);
      });

      uppyInstance.on('file-added', file => {
        const { id } = file;
        const uppy = getUppyInstance(getState());

        readFileMetadataAsync(file).then(metadata => {
          uppy.setFileMeta(id, metadata);
          if (metadata.thumbnail) {
            uppy.setFileState(id, {
              preview: metadata.thumbnail,
            });
          }

          const newFile = uppy.getFile(id);
          const listing = uppyFileToListing(newFile);
          dispatch({ type: ADD_FILE, payload: listing });
          updateAiTermsStatus(getState, dispatch);
        });
      });

      uppyInstance.on('cancel-all', () => {
        dispatch({ type: RESET_FILES });
      });

      uppyInstance.on('thumbnail:generated', (file, preview) => {
        const { id } = file;
        const listing = getSingleListing(getState(), id);
        if (!listing.preview) {
          dispatch({ type: PREVIEW_GENERATED, payload: { id, preview } });
        }
      });

      uppyInstance.on('transloadit:result', (_, result) => {
        const { localId, ssl_url } = result;
        dispatch({ type: UPDATE_LISTING, payload: { id: localId, previewUrl: ssl_url } });
      });

      uppyInstance.on('complete', async result => {
        const listingsDefaults = getListingsDefaults(getState());

        if (result.failed?.length) {
          result.failed.forEach(failed => {
            const failedListing = getSingleListing(getState(), failed.id);
            dispatch({ type: ADD_FAILED_LISTING, payload: failedListing });
          });
        }

        for (let successfulUpload of result.successful) {
          const { uploadURL } = successfulUpload;
          const listing = getSingleListing(getState(), successfulUpload.id);
          try {
            const { currency, transactionType } = listingsDefaults;
            const truncatedPrice = truncateToSubUnitPrecision(listing.price, unitDivisor(currency));
            const price = convertUnitToSubUnit(truncatedPrice, unitDivisor(currency));

            const listingData = {
              title: listing.title,
              description: listing.description,
              publicData: {
                listingType: LISTING_TYPES.PRODUCT,
                categoryLevel1: getListingCategory(listing),
                imageryCategory: listing.category,
                usage: listing.usage,
                releases: listing.releases,
                keywords: listing.keywords,
                imageSize: listing.dimensions,
                fileType: listing.type,
                aiTerms: listing.isAi ? 'yes' : 'no',
                originalFileName: listing.name,
                transactionProcessAlias: transactionType.alias,
                unitType: transactionType.unitType,
              },
              privateData: {
                previewAssetUrl: listing.previewUrl,
                originalAssetUrl: uploadURL,
              },
              price: {
                amount: price,
                currency: currency,
              },
            };

            await sdk.ownListings.create(listingData, {
              expand: true,
            });
            dispatch({ type: ADD_SUCCESSFUL_LISTING, payload: listing });
          } catch (error) {
            dispatch({ type: ADD_FAILED_LISTING, payload: listing });
            console.error('Error during image upload:', error);
          }
        }

        const { successfulListings, failedListings, selectedRowsKeys } = getSaveListingData(
          getState()
        );

        const totalListingsProcessed = successfulListings.length + failedListings.length;
        if (totalListingsProcessed === selectedRowsKeys.length) {
          dispatch({
            type: failedListings.length > 0 ? SAVE_LISTINGS_ERROR : SAVE_LISTINGS_SUCCESS,
          });
        }
      });

      uppyInstance.on('error', error => {
        if (error.assembly) {
          console.error(`Assembly ID ${error.assembly.assembly_id} failed!`);
        }
      });
    });
  };
}

export const requestUpdateListing = payload => dispatch => {
  dispatch({ type: UPDATE_LISTING, payload });
};

export function requestSaveBatchListings(pageMode = PAGE_MODE_CREATE) {
  return (dispatch, getState, sdk) => {
    dispatch({ type: SAVE_LISTINGS_REQUEST });

    const selectedListingsIds = getSelectedRowsKeys(getState());
    const listings = getListings(getState()).filter(listing =>
      selectedListingsIds.includes(listing.id)
    );

    // Validate required fields for all listings
    const invalidListings = listings
      .map(validateListingProperties)
      .filter(result => result !== null);

    if (invalidListings.length > 0) {
      // Dispatch action to store invalid file names in state and trigger modal
      dispatch({ type: SET_INVALID_LISTINGS, payload: invalidListings.map(f => f.listing.name) });
      return; // Abort saving if there are invalid listings
    }

    // Check if any AI content is listed and if terms are accepted
    const aiListings = listings.filter(listing => listing.isAi);
    const aiTermsAccepted = getAiTermsAccepted(getState());
    if (aiListings.length > 0 && !aiTermsAccepted) {
      // Dispatch action to trigger modal for AI terms
      // Here you would display a different modal if AI listings are present
      dispatch({ type: SET_AI_TERMS_REQUIRED });
      return; // Abort saving until terms are accepted
    }

    if (pageMode === PAGE_MODE_CREATE) {
      // Proceed with saving the listings if all validations pass
      const uppy = getUppyInstance(getState());
      uppy.upload();
    } else {
      const listingsDefaults = getListingsDefaults(getState());
      const { currency } = listingsDefaults;

      const listingPromises = listings.map(listing => {
        return new Promise((resolve, reject) => {
          const truncatedPrice = truncateToSubUnitPrecision(listing.price, unitDivisor(currency));
          const price = convertUnitToSubUnit(truncatedPrice, unitDivisor(currency));
          const id = new UUID(listing.id);
          sdk.ownListings
            .update(
              {
                id,
                title: listing.title,
                description: listing.description,
                publicData: {
                  imageryCategory: listing.category,
                  usage: listing.usage,
                  releases: listing.releases,
                  keywords: listing.keywords,
                  imageSize: listing.dimensions,
                  aiTerms: listing.isAi ? 'yes' : 'no',
                },
                price: {
                  amount: price,
                  currency: currency,
                },
              },
              {
                expand: true,
              }
            )
            .then(() => {
              dispatch({ type: ADD_SUCCESSFUL_LISTING, payload: listing });
              resolve();
            })
            .catch(ex => {
              console.error('Failed saving listing', ex);
              dispatch({ type: ADD_FAILED_LISTING, payload: listing });
              reject();
            });
        });
      });

      Promise.all(listingPromises)
        .then(() => dispatch({ type: SAVE_LISTINGS_SUCCESS }))
        .catch(() => dispatch({ type: SAVE_LISTINGS_ERROR }));
    }
  };
}

export const queryOwnListings = queryParams => (dispatch, getState, sdk) => {
  dispatch({
    type: FETCH_LISTINGS_FOR_EDIT_REQUEST,
    payload: { queryParams },
  });

  const { perPage, ...rest } = queryParams;
  const params = { ...rest, perPage };

  return sdk.ownListings
    .query(params)
    .then(response => {
      dispatch({
        type: FETCH_LISTINGS_FOR_EDIT_REQUEST_SUCCESS,
        payload: response,
      });

      return response;
    })
    .catch(e => {
      dispatch(queryListingsError(storableError(e)));
      throw e;
    });
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const { transactionType } = config.listing.listingTypes.find(
    ({ listingType }) => listingType === LISTING_TYPES.PRODUCT
  );
  dispatch({
    type: SET_LISTINGS_DEFAULTS,
    payload: {
      currency: config.currency,
      transactionType,
    },
  });

  const { mode } = params;
  if (mode !== PAGE_MODE_CREATE) {
    const pageQueryParams = parse(search);
    const page = pageQueryParams.page || 1;
    const queryParams = new URLSearchParams();
    if (pageQueryParams.category) {
      queryParams.set('pub_categoryLevel1', pageQueryParams.category);
    }
    if (pageQueryParams.type) {
      queryParams.set('pub_listingType', pageQueryParams.type);
    }

    dispatch(
      queryOwnListings({
        ...queryParams,
        page,
        perPage: RESULT_PAGE_SIZE,
        include: ['images'],
        'fields.image': ['variants.default'],
        'limit.images': 1,
      })
    );
  }

  const imageryCategoryOptions = getListingFieldOptions(config, 'imageryCategory');
  const usageOptions = getListingFieldOptions(config, 'usage');

  dispatch({
    type: FETCH_LISTING_OPTIONS,
    payload: {
      categories: imageryCategoryOptions,
      usages: usageOptions,
    },
  });

  const fetchCurrentUserOptions = {
    updateNotifications: false,
  };
  return dispatch(fetchCurrentUser(fetchCurrentUserOptions))
    .then(response => {
      dispatch({ type: SET_USER_ID, payload: response.id });
      return response;
    })
    .catch(e => {
      throw e;
    });
};
