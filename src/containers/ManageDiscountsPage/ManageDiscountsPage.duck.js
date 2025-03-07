import { storableError } from '../../util/errors';
import {
  fetchCurrentUser,
  TOGGLE_FAVORITE_ERROR,
  TOGGLE_FAVORITE_REQUEST,
  TOGGLE_FAVORITE_SUCCESS, toggleFavoriteError,
  toggleFavoriteRequest, toggleFavoriteSuccess,
} from '../../ducks/user.duck';

// ================ Action types ================ //

export const CREATE_DISCOUNT_REQUEST = 'app/ManageDiscountsPage/CREATE_DISCOUNT_REQUEST';
export const CREATE_DISCOUNT_SUCCESS = 'app/ManageDiscountsPage/CREATE_DISCOUNT_SUCCESS';
export const CREATE_DISCOUNT_ERROR = 'app/ManageDiscountsPage/CREATE_DISCOUNT_ERROR';

export const UPDATE_DISCOUNT_REQUEST = 'app/ManageDiscountsPage/UPDATE_DISCOUNT_REQUEST';
export const UPDATE_DISCOUNT_SUCCESS = 'app/ManageDiscountsPage/UPDATE_DISCOUNT_SUCCESS';
export const UPDATE_DISCOUNT_ERROR = 'app/ManageDiscountsPage/UPDATE_DISCOUNT_ERROR';

export const DELETE_DISCOUNT_REQUEST = 'app/ManageDiscountsPage/DELETE_DISCOUNT_REQUEST';
export const DELETE_DISCOUNT_SUCCESS = 'app/ManageDiscountsPage/DELETE_DISCOUNT_SUCCESS';
export const DELETE_DISCOUNT_ERROR = 'app/ManageDiscountsPage/DELETE_DISCOUNT_ERROR';

export const UPDATE_ALL_DISCOUNTS_REQUEST = 'app/ManageDiscountsPage/UPDATE_ALL_DISCOUNTS_REQUEST';
export const UPDATE_ALL_DISCOUNTS_SUCCESS = 'app/ManageDiscountsPage/UPDATE_ALL_DISCOUNTS_SUCCESS';
export const UPDATE_ALL_DISCOUNTS_ERROR = 'app/ManageDiscountsPage/UPDATE_ALL_DISCOUNTS_ERROR';

// ================ Reducer ================ //

const initialState = {
  createDiscountInProgress: false,
  createDiscountError: null,
  updateDiscountInProgress: false,
  updateDiscountError: null,
  deleteDiscountInProgress: false,
  deleteDiscountError: null,
  updateAllDiscountsInProgress: false,
  updateAllDiscountsError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case CREATE_DISCOUNT_REQUEST:
      return {
        ...state,
        createDiscountInProgress: true,
        createDiscountError: null,
      };
    case CREATE_DISCOUNT_SUCCESS:
      return {
        ...state,
        createDiscountInProgress: false,
      };
    case CREATE_DISCOUNT_ERROR:
      return {
        ...state,
        createDiscountInProgress: false,
        createDiscountError: payload,
      };

    case UPDATE_DISCOUNT_REQUEST:
      return {
        ...state,
        updateDiscountInProgress: true,
        updateDiscountError: null,
      };
    case UPDATE_DISCOUNT_SUCCESS:
      return {
        ...state,
        updateDiscountInProgress: false,
      };
    case UPDATE_DISCOUNT_ERROR:
      return {
        ...state,
        updateDiscountInProgress: false,
        updateDiscountError: payload,
      };

    case DELETE_DISCOUNT_REQUEST:
      return {
        ...state,
        deleteDiscountInProgress: true,
        deleteDiscountError: null,
      };
    case DELETE_DISCOUNT_SUCCESS:
      return {
        ...state,
        deleteDiscountInProgress: false,
      };
    case DELETE_DISCOUNT_ERROR:
      return {
        ...state,
        deleteDiscountInProgress: false,
        deleteDiscountError: payload,
      };

    case UPDATE_ALL_DISCOUNTS_REQUEST:
      return {
        ...state,
        updateAllDiscountsInProgress: true,
        updateAllDiscountsError: null,
      };
    case UPDATE_ALL_DISCOUNTS_SUCCESS:
      return {
        ...state,
        updateAllDiscountsInProgress: false,
      };
    case UPDATE_ALL_DISCOUNTS_ERROR:
      return {
        ...state,
        updateAllDiscountsInProgress: false,
        updateAllDiscountsError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const createDiscountRequest = () => ({
  type: CREATE_DISCOUNT_REQUEST,
});

export const createDiscountSuccess = () => ({
  type: CREATE_DISCOUNT_SUCCESS,
});

export const createDiscountError = e => ({
  type: CREATE_DISCOUNT_ERROR,
  error: true,
  payload: e,
});

export const updateDiscountRequest = () => ({
  type: UPDATE_DISCOUNT_REQUEST,
});

export const updateDiscountSuccess = () => ({
  type: UPDATE_DISCOUNT_SUCCESS,
});

export const updateDiscountError = e => ({
  type: UPDATE_DISCOUNT_ERROR,
  error: true,
  payload: e,
});

export const deleteDiscountRequest = () => ({
  type: DELETE_DISCOUNT_REQUEST,
});

export const deleteDiscountSuccess = () => ({
  type: DELETE_DISCOUNT_SUCCESS,
});

export const deleteDiscountError = e => ({
  type: DELETE_DISCOUNT_ERROR,
  error: true,
  payload: e,
});

export const updateAllDiscountsRequest = () => ({
  type: UPDATE_ALL_DISCOUNTS_REQUEST,
});

export const updateAllDiscountsSuccess = () => ({
  type: UPDATE_ALL_DISCOUNTS_SUCCESS,
});

export const updateAllDiscountsError = e => ({
  type: UPDATE_ALL_DISCOUNTS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const createDiscount = discountProps => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.reject(new Error('Provider discounts for anonimous users are not supported'));
  }

  dispatch( createDiscountRequest());

  const { providerDiscounts = {}} = currentUser?.attributes?.profile?.privateData || {};
  const { code, ...rest } = discountProps;

  return sdk.currentUser
    .updateProfile({ privateData: { providerDiscounts }}, {  expand: false, })
    .then(() => {
      dispatch( fetchCurrentUser());

      return dispatch(  createDiscountSuccess());
    })
    .catch(e => dispatch(  createDiscountError( storableError(e))));
};

export const updateDiscount = discountProps => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.reject(new Error('Provider discounts for anonimous users are not supported'));
  }

  dispatch( updateDiscountRequest());

  const { providerDiscounts = {}} = currentUser?.attributes?.profile?.privateData || {};
  const { code, ...rest } = discountProps;

  return sdk.currentUser
    .updateProfile({ privateData: { providerDiscounts }}, {  expand: false, })
    .then(() => {
      dispatch( fetchCurrentUser());

      return dispatch( updateDiscountSuccess());
    })
    .catch(e => dispatch( updateDiscountError( storableError(e))));
};

export const deleteDiscount = discountCode => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.reject(new Error('Provider discounts for anonimous users are not supported'));
  }

  dispatch( deleteDiscountRequest());

  const { providerDiscounts = {}} = currentUser?.attributes?.profile?.privateData || {};

  delete providerDiscounts[ discountCode ];

  return sdk.currentUser
    .updateProfile({ privateData: { providerDiscounts }}, {  expand: false, })
    .then(() => {
      dispatch( fetchCurrentUser());

      return dispatch( deleteDiscountSuccess());
    })
    .catch(e => dispatch( deleteDiscountError( storableError(e))));
};

export const updateAllDiscounts = providerDiscounts => (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    return Promise.reject(new Error('Provider discounts for anonimous users are not supported'));
  }

  dispatch( updateAllDiscountsRequest());

  return sdk.currentUser
    .updateProfile({ privateData: { providerDiscounts }}, {  expand: false, })
    .then(() => {
      dispatch( fetchCurrentUser());

      return dispatch( updateAllDiscountsSuccess());
    })
    .catch(e => dispatch( updateAllDiscountsError( storableError(e))));
};
