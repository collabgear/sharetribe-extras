import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, UserNav, H3, LayoutSalesSideNavigation } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import DiscountsForm from './DiscountsForm/DiscountsForm';

import {
  createDiscount, updateDiscount, deleteDiscount, updateAllDiscounts
} from './ManageDiscountsPage.duck';
import css from './ManageDiscountsPage.module.css';

/**
 * The change-password page.
 *
 * @param {Object} props
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {function} props.onCreateDiscount - The function to create the new discount
 * @param {function} props.onUpdateDiscount - The function to update the existing discount
 * @param {function} props.onDeleteDiscount - The function to delete the existing discount
 * @param {function} props.onUpdateAllDiscounts - The function to update all the existing discount of the current user
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {boolean} props.createDiscountInProgress - Whether the discount creation is in progress
 * @param {boolean} props.updateDiscountInProgress - Whether the discount update is in progress
 * @param {boolean} props.deleteDiscountInProgress - Whether the discount removal is in progress
 * @param {boolean} props.updateAllDiscountsInProgress - Whether the discounts bulk update is in progress
 * @param {propTypes.error} props.createDiscountError - The discount creation error
 * @param {propTypes.error} props.updateDiscountError - The discount update error
 * @param {propTypes.error} props.deleteDiscountError - The discount delete error
 * @param {propTypes.error} props.updateAllDiscountsError - The discounts bulk update error
 * @returns {JSX.Element} Manage discounts page component
 */
export const ManageDiscountsPageComponent = props => {
  const intl = useIntl();
  const {
    currentUser,
    onUpdateAllDiscounts,
    updateAllDiscountsInProgress = false,
    updateAllDiscountsError,
    scrollingDisabled,
  } = props;
  const { providerDiscounts = {}} = currentUser?.attributes?.profile?.privateData || {};
  const discounts = Object.values( providerDiscounts );

  const onSubmitUpdateDiscounts = values => {
    const { discounts = []} = values;
    const providerDiscounts = {};

    discounts.forEach( d => providerDiscounts[ d.code ] = d );

    onUpdateAllDiscounts( providerDiscounts );
  };

  const discountsForm =
    currentUser && currentUser.id ? (
      <DiscountsForm
        className={css.form}
        currentUser={currentUser}
        initialValues={{ discounts }}
        onSubmit={onSubmitUpdateDiscounts}
        updateAllDiscountsInProgress={updateAllDiscountsInProgress}
        updateAllDiscountsError={updateAllDiscountsError}
      />
    ) : null;

  const title = intl.formatMessage({ id: 'ManageDiscountsPage.title' });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSalesSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav currentPage="ManageDiscountsPage" />
          </>
        }
        sideNav={null}
        useSalesNav
        currentPage="ManageDiscountsPage"
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1">
            <FormattedMessage id="ManageDiscountsPage.heading" />
          </H3>
          {discountsForm}
        </div>
      </LayoutSalesSideNavigation>
    </Page>
  );
};

const mapStateToProps = state => {
  // Topbar needs user info.
  const {
    createDiscountInProgress,
    updateDiscountInProgress,
    deleteDiscountInProgress,
    updateAllDiscountsInProgress,
    createDiscountError,
    updateDiscountError,
    deleteDiscountError,
    updateAllDiscountsError,
  } = state.ManageDiscountsPage;
  const { currentUser } = state.user;
  return {
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
    createDiscountInProgress,
    updateDiscountInProgress,
    deleteDiscountInProgress,
    updateAllDiscountsInProgress,
    createDiscountError,
    updateDiscountError,
    deleteDiscountError,
    updateAllDiscountsError,
  };
};

const mapDispatchToProps = dispatch => ({
  onCreateDiscount: discountProps => dispatch( createDiscount( discountProps )),
  onUpdateDiscount: discountProps => dispatch( updateDiscount( discountProps )),
  onDeleteDiscount: discountCode => dispatch( deleteDiscount( discountCode )),
  onUpdateAllDiscounts: discounts => dispatch( updateAllDiscounts( discounts )),
});

const ManageDiscountsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ManageDiscountsPageComponent);

export default ManageDiscountsPage;
