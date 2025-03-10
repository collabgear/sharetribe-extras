import React, { Component } from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { ensureCurrentUser } from '../../../util/data';
import { isChangePasswordWrongPassword } from '../../../util/errors';

import {
  H4,
  Form,
  PrimaryButton,
  FieldTextInput,
  FieldSelect,
  InlineTextButton,
  PrimaryButtonInline
} from '../../../components';

import css from './DiscountsForm.module.css';

/**
 * The discounts management form .
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form ID
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {function} props.onSubmit - The function to submit the form
 * @param {boolean} [props.inProgress] - Whether the form is in progress
 * @param {boolean} [props.updateAllDiscountsInProgress] - Whether the bulk update of all provider's discounts is in progress
 * @param {boolean} props.ready - Whether the form is ready
 * @param {propTypes.error} [props.updateAllDiscountsError] - The bulk update all provider's discounts error
 * @returns {JSX.Element} Discounts form component
 */
class DiscountsForm extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        mutators={{ ...arrayMutators }}
        render={fieldRenderProps => {
          const {
            rootClassName,
            className,
            form: { mutators: { push, pop }}, // injected from final-form-arrays
            formId,
            updateAllDiscountsError,
            currentUser,
            handleSubmit,
            inProgress = false,
            updateAllDiscountsInProgress = false,
            invalid,
            pristine,
            ready,
            form,
            values,
          } = fieldRenderProps;

          const intl = useIntl();
          const user = ensureCurrentUser(currentUser);

          if (!user.id) {
            return null;
          }

          // Discount code field placeholder
          const discountCodePlaceholder = intl.formatMessage({
            id: 'DiscountsForm.discountCodePlaceholder',
          });

          // Discount title field placeholder
          const discountTitlePlaceholder = intl.formatMessage({
            id: 'DiscountsForm.discountTitlePlaceholder',
          });

          // Discount type field placeholder
          const discountTypePlaceholder = intl.formatMessage({
            id: 'DiscountsForm.discountTypePlaceholder',
          });
          // Discount type field - percentage
          const discountTypePercentage = intl.formatMessage({
            id: 'DiscountsForm.discountTypePercentage',
          });
          // Discount type field - monetary value
          const discountTypeMonetary = intl.formatMessage({
            id: 'DiscountsForm.discountTypeMonetary',
          });

          // Discount value field placeholder
          const discountValuePlaceholder = intl.formatMessage({
            id: 'DiscountsForm.discountValuePlaceholder',
          });

          // Discount code validations

          const discountCodeRequiredMessage = intl.formatMessage({
            id: 'DiscountsForm.discountCodeRequired',
          });

          const discountCodeMinLengthMessage = intl.formatMessage(
            {
              id: 'DiscountsForm.discountCodeTooShort',
            },
            {
              minLength: validators.DISCOUNT_CODE_MIN_LENGTH,
            }
          );

          const discountCodeMaxLengthMessage = intl.formatMessage(
            {
              id: 'DiscountsForm.discountCodeTooLong',
            },
            {
              maxLength: validators.DISCOUNT_CODE_MAX_LENGTH,
            }
          );

          const discountCodeFormatMessage = intl.formatMessage({
              id: 'DiscountsForm.discountCodeInvalidFormat'
          });

          const discountCodeRequired = validators.requiredStringNoTrim(
            discountCodeRequiredMessage
          );
          const discountCodeMinLength = validators.minLength(
            discountCodeMinLengthMessage,
            validators.DISCOUNT_CODE_MIN_LENGTH
          );
          const discountCodeMaxLength = validators.maxLength(
            discountCodeMaxLengthMessage,
            validators.DISCOUNT_CODE_MAX_LENGTH
          );
          const discountCodeFormat = validators.discountCodeFormatValid(
            discountCodeFormatMessage
          );

          // Discount title validations

          const discountTitleRequiredMessage = intl.formatMessage({
            id: 'DiscountsForm.discountTitleRequired',
          });

          const discountTitleMaxLengthMessage = intl.formatMessage(
            {
              id: 'DiscountsForm.discountTitleTooLong',
            },
            {
              maxLength: validators.DISCOUNT_TITLE_MAX_LENGTH,
            }
          );

          const discountTitleRequired = validators.requiredStringNoTrim(
            discountTitleRequiredMessage
          );
          const discountTitleMaxLength = validators.maxLength(
            discountTitleMaxLengthMessage,
            validators.DISCOUNT_TITLE_MAX_LENGTH
          );

          // Discount type validation

          const discountTypeRequiredMessage = intl.formatMessage({
            id: 'DiscountsForm.discountTypeRequired',
          });

          const discountTypeRequired = validators.required(
            discountTypeRequiredMessage
          );

          // TODO: implement more rigorous checks for the discount values
          // TODO: implement the check to eliminate duplicate codes

          // Discount value validation

          const discountValueRequiredMessage = intl.formatMessage({
            id: 'DiscountsForm.discountValueRequired',
          });

          const discountValueRequired = validators.required(
            discountValueRequiredMessage
          );

          const genericFailure =
            updateAllDiscountsError ? (
              <span className={css.error}>
                <FormattedMessage id="DiscountsForm.genericFailure" />
              </span>
            ) : null;

          const classes = classNames(rootClassName || css.root, className);
          const submitDisabled = invalid || inProgress;

          return (
            <Form
              className={classes}
              onSubmit={e => {
                handleSubmit(e)
                  .then(() => {
                  })
                  .catch(() => {
                    // Error is handled in duck file already.
                  });
              }}
            >
              <div className={css.discountsSection}>
                <div className={css.topButtonsWrapper}>
                  <InlineTextButton
                    className={css.helperLink}
                    onClick={() => push('discounts', undefined)}
                  >
                    <FormattedMessage id="DiscountsForm.addNewDiscount" />
                  </InlineTextButton>
                </div>
                <FieldArray name="discounts">
                  {({ fields }) =>
                    fields.map((name, index) => (
                      <div className={css.discountRow} key={name}>
                        <label className={css.discountLabel}>
                          <FormattedMessage id="DiscountsForm.discountLabel" values={{ discountIndex: index + 1 }}/>
                        </label>

                        <FieldTextInput
                          type="text"
                          className={css.codeField}
                          id={formId ? `${formId}.${name}.code` : `${name}.code`}
                          name={`${name}.code`}
                          placeholder={discountCodePlaceholder}
                          validate={validators.composeValidators(
                            discountCodeRequired,
                            discountCodeMinLength,
                            discountCodeMaxLength,
                            discountCodeFormat
                          )}
                        />

                        <FieldTextInput
                          type="text"
                          className={css.titleField}
                          id={formId ? `${formId}.${name}.title` : `${name}.title`}
                          name={`${name}.title`}
                          placeholder={discountTitlePlaceholder}
                          validate={validators.composeValidators(
                            discountTitleRequired,
                            discountTitleMaxLength
                          )}
                        />

                        <FieldSelect
                          className={css.typeField}
                          id={formId ? `${formId}.${name}.type` : `${name}.type`}
                          name={`${name}.type`}
                          validate={discountTypeRequired}
                        >
                          <option disabled value="">
                            {discountTypePlaceholder}
                          </option>
                          <option key={'percent'} value={'percent'}>
                            {discountTypePercentage}
                          </option>
                          <option key={'monetary'} value={'monetary'}>
                            {discountTypeMonetary}
                          </option>
                        </FieldSelect>

                        <FieldTextInput
                          type="number"
                          className={css.amountField}
                          id={formId ? `${formId}.${name}.amount` : `${name}.amount`}
                          name={`${name}.amount`}
                          placeholder={discountValuePlaceholder}
                          validate={validators.composeValidators(
                            discountValueRequired
                          )}
                        />

                        <span
                          className={css.removeDiscountIcon}
                          onClick={() => fields.remove(index)}
                        >
                          ❌
                        </span>
                      </div>
                    ))
                  }
                </FieldArray>
              </div>

              <div className={css.bottomWrapper}>
                {genericFailure}
                <PrimaryButton
                  className={css.saveButton}
                  type="submit"
                  inProgress={inProgress}
                  ready={ready}
                  disabled={submitDisabled}
                >
                  <FormattedMessage id="DiscountsForm.saveChanges" />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

export default DiscountsForm;
