import React, { useEffect, useState } from 'react';
import swal from 'sweetalert';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { ResponsiveImage, Modal, IconHeart } from '../../components';
import { createResourceLocatorString } from '../../util/routes';
import { useConfiguration } from '../../context/configurationContext';

import ImageCarousel from './ImageCarousel/ImageCarousel';
import ActionBarMaybe from './ActionBarMaybe';

import css from './ListingPage.module.css';

import { FILL_TYPE_EMPTY, FILL_TYPE_FULL, SIZE_BIG } from '../../components/IconHeart/IconHeart';

const SectionHero = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    title,
    listing,
    isOwnListing,
    editParams,
    currentUser,
    handleViewPhotosClick,
    imageCarouselOpen,
    onImageCarouselClose,
    onManageDisableScrolling,
    noPayoutDetailsSetWithOwnListing,
    history,
    routeConfiguration,
    onToggleFavorite,
  } = props;

  const hasImages = listing.images && listing.images.length > 0;
  const firstImage = hasImages ? listing.images[0] : null;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith('scaled'))
    : [];
  const { favoriteListingIds = []} = currentUser?.attributes?.profile?.privateData || {};
  const isFavorite = favoriteListingIds.includes( listing.id.uuid );

  const viewPhotosButton = hasImages ? (
    <button className={css.viewPhotos} onClick={handleViewPhotosClick}>
      <FormattedMessage
        id="ListingPage.viewImagesButton"
        values={{ count: listing.images.length }}
      />
    </button>
  ) : null;

  const confirmSignIn = () => {
    return swal({
      title: intl.formatMessage({ id: "ListingPage.favoriteSignInTitle" }),
      text: intl.formatMessage({ id: "ListingPage.favoriteSignInText" }),
      icon: "info",
      buttons: [
        intl.formatMessage({ id: "ListingPage.favoriteSignInCancelButton" }),
        intl.formatMessage({ id: "ListingPage.favoriteSignInOkButton" }),
      ],
      closeOnClickOutside: true,
      closeOnEsc: true,
    });
  };

  const warnMaxFavorites = () => {
    return swal({
      title: intl.formatMessage({ id: "ListingPage.maxFavoritesWarningTitle"}),
      text: intl.formatMessage(
        { id: "ListingPage.maxFavoritesWarningText"},
        { maxFavoritesAmount: config.maxFavoritesAmount }
      ),
      icon: "warning",
      buttons: {
        close: intl.formatMessage({ id: "ListingPage.maxFavoritesWarningButton" }),
      },
      closeOnClickOutside: true,
      closeOnEsc: true,
    });
  };

  const toggleFavorite = listingId => {
    if( favoriteListingIds.length >= config.maxFavoritesAmount && !isFavorite ){
      return warnMaxFavorites();
    }

    if( onToggleFavorite ){
      if( currentUser ) {
        onToggleFavorite( listingId );
      } else {
        confirmSignIn.then( willSignIn => {
          if( willSignIn ){
            history.push(createResourceLocatorString('LoginPage', routeConfiguration, {}));
          }
        });
      }
    }
  };

  const favoritesMark = (
    <div
      title={ intl.formatMessage({
        id: isFavorite ? "ListingPage.removeFromFavoritesHint" : "ListingPage.addToFavoritesHint"
      })}
      className={css.heartIconWrapper}
      onClick={ event => {
        event.preventDefault();
        event.stopPropagation();

        toggleFavorite( listing.id.uuid );
      }}
    >
      <IconHeart
        fillType={ isFavorite ? FILL_TYPE_FULL : FILL_TYPE_EMPTY }
        size={SIZE_BIG}
      />
    </div>
  );

  return (
    <section className={css.sectionHero} data-testid="hero">
      <div className={css.imageWrapperForSectionHero} onClick={handleViewPhotosClick}>
        {mounted && listing.id && isOwnListing ? (
          <div onClick={e => e.stopPropagation()} className={css.actionBarContainerForHeroLayout}>
            {noPayoutDetailsSetWithOwnListing ? (
              <ActionBarMaybe
                className={css.actionBarForHeroLayout}
                isOwnListing={isOwnListing}
                listing={listing}
                showNoPayoutDetailsSet={noPayoutDetailsSetWithOwnListing}
                currentUser={currentUser}
              />
            ) : null}

            <ActionBarMaybe
              className={css.actionBarForHeroLayout}
              isOwnListing={isOwnListing}
              listing={listing}
              editParams={editParams}
              currentUser={currentUser}
            />
          </div>
        ) : null}

        {favoritesMark}
        <ResponsiveImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
        />
        {viewPhotosButton}
      </div>
      <Modal
        id="ListingPage.imageCarousel"
        scrollLayerClassName={css.carouselModalScrollLayer}
        containerClassName={css.carouselModalContainer}
        lightCloseButton
        isOpen={imageCarouselOpen}
        onClose={onImageCarouselClose}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <ImageCarousel
          images={listing.images}
          imageVariants={['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge']}
        />
      </Modal>
    </section>
  );
};

export default SectionHero;
